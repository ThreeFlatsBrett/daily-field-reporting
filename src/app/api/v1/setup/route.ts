import { NextRequest } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, tenants } from "@/db/schema";
import { z } from "zod";

const SetupSchema = z.object({
  email: z.string().email(),
  name:  z.string().min(1),
});

// POST /api/v1/setup — creates the first admin user (one-time only)
export async function POST(req: NextRequest) {
  try {
    // Guard: only works when no users exist
    const existingUsers = await db.select({ id: users.id }).from(users).limit(1);
    if (existingUsers.length > 0) {
      return Response.json(
        { error: "Setup is already complete. Sign in to continue." },
        { status: 403 }
      );
    }

    const body = SetupSchema.safeParse(await req.json());
    if (!body.success) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const { email, name } = body.data;

    // Grab the first (and only) tenant
    const [tenant] = await db.select().from(tenants).limit(1);
    if (!tenant) {
      return Response.json({ error: "No tenant found. Run the database seed first." }, { status: 500 });
    }

    const clerk = await clerkClient();

    // Send a Clerk invitation — user gets an email to set their password
    const invitation = await clerk.invitations.createInvitation({
      emailAddress: email,
      redirectUrl:  `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/sign-in`,
      publicMetadata: {
        tenantId: tenant.id,
        role:     "admin",
        name,
      },
      notify:         true,
      ignoreExisting: true,
    });

    // Pre-create the DB row (activated by webhook when they accept)
    await db.insert(users).values({
      tenantId:    tenant.id,
      clerkUserId: `invited_${invitation.id}`,
      email,
      name,
      role:     "admin",
      isActive: false,
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[setup]", err);
    return Response.json({ error: "Setup failed. Check server logs." }, { status: 500 });
  }
}
