import { NextRequest } from "next/server";
import { Webhook } from "svix";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { UserRole } from "@/types";

interface ClerkUserPayload {
  id: string;
  email_addresses: { email_address: string; id: string }[];
  first_name: string | null;
  last_name: string | null;
  public_metadata: {
    tenantId?: string;
    role?: UserRole;
    name?: string;
  };
}

interface ClerkWebhookEvent {
  type: "user.created" | "user.updated" | "user.deleted";
  data: ClerkUserPayload;
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    // No secret configured — skip verification but still process (dev only)
    console.warn("[webhook] CLERK_WEBHOOK_SECRET not set — skipping signature verification");
  }

  const svixId        = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  const body = await req.text();

  let event: ClerkWebhookEvent;

  if (webhookSecret && svixId && svixTimestamp && svixSignature) {
    try {
      const wh = new Webhook(webhookSecret);
      event = wh.verify(body, {
        "svix-id":        svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as ClerkWebhookEvent;
    } catch {
      return Response.json({ error: "Invalid webhook signature" }, { status: 400 });
    }
  } else {
    try {
      event = JSON.parse(body) as ClerkWebhookEvent;
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }
  }

  if (event.type === "user.created" || event.type === "user.updated") {
    const { id, email_addresses, first_name, last_name, public_metadata } = event.data;
    const { tenantId, role, name: metaName } = public_metadata;

    if (!tenantId || !role) {
      // User created outside our invite flow (e.g. setup page) — skip
      return Response.json({ ok: true, skipped: "no tenantId or role in metadata" });
    }

    const email = email_addresses[0]?.email_address ?? "";
    const name  = metaName ?? [first_name, last_name].filter(Boolean).join(" ") || email;

    // Check for a pending (invited) row matching this email+tenant
    const [pending] = await db
      .select()
      .from(users)
      .where(and(eq(users.tenantId, tenantId), eq(users.email, email)))
      .limit(1);

    if (pending) {
      // Activate the pending row with the real Clerk user ID
      await db
        .update(users)
        .set({ clerkUserId: id, name, role, isActive: true, updatedAt: new Date() })
        .where(eq(users.id, pending.id));
    } else {
      // No pending row — insert fresh (e.g. setup flow)
      await db
        .insert(users)
        .values({ tenantId, clerkUserId: id, email, name, role, isActive: true })
        .onConflictDoUpdate({
          target: users.clerkUserId,
          set: { email, name, role, isActive: true, updatedAt: new Date() },
        });
    }
  }

  return Response.json({ ok: true });
}
