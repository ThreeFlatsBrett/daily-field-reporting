import { NextRequest } from "next/server";
import { Webhook } from "svix";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { UserRole } from "@/types";

interface ClerkUserPayload {
  id: string;
  email_addresses: { email_address: string; id: string }[];
  first_name: string | null;
  last_name: string | null;
  public_metadata: {
    tenantId?: string;
    role?: UserRole;
  };
}

interface ClerkWebhookEvent {
  type: "user.created" | "user.updated" | "user.deleted";
  data: ClerkUserPayload;
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return Response.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return Response.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(webhookSecret);

  let event: ClerkWebhookEvent;
  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent;
  } catch {
    return Response.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  if (event.type === "user.created" || event.type === "user.updated") {
    const { id, email_addresses, first_name, last_name, public_metadata } = event.data;
    const { tenantId, role } = public_metadata;

    if (!tenantId || !role) {
      return Response.json({ ok: true, skipped: "no tenantId or role in metadata" });
    }

    const email = email_addresses[0]?.email_address ?? "";
    const name = [first_name, last_name].filter(Boolean).join(" ") || email;

    await db
      .insert(users)
      .values({ tenantId, clerkUserId: id, email, name, role })
      .onConflictDoUpdate({
        target: users.clerkUserId,
        set: { email, name, role, updatedAt: new Date() },
      });
  }

  return Response.json({ ok: true });
}
