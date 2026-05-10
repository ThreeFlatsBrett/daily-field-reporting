import { NextRequest } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthContext } from "@/lib/auth/get-tenant";
import { requireRole } from "@/lib/auth/permissions";
import { ok, created, handleError } from "@/lib/api/response";
import { validate } from "@/lib/api/validate";
import { InviteUserSchema } from "@/types/api";

// GET /api/v1/users — list all users in the tenant
export async function GET() {
  try {
    const ctx = await getAuthContext();
    requireRole(ctx, ["admin"]);

    const tenantUsers = await db
      .select()
      .from(users)
      .where(eq(users.tenantId, ctx.tenantId))
      .orderBy(users.createdAt);

    return ok(tenantUsers.map((u) => ({
      ...u,
      isPending: u.clerkUserId.startsWith("invited_"),
    })));
  } catch (err) {
    return handleError(err);
  }
}

// POST /api/v1/users — invite a user into this tenant via Clerk invitation
export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    requireRole(ctx, ["admin"]);

    const body = await validate(req, InviteUserSchema);

    // Check if user already exists and is active
    const [existing] = await db
      .select()
      .from(users)
      .where(and(eq(users.tenantId, ctx.tenantId), eq(users.email, body.email)))
      .limit(1);

    if (existing && existing.isActive && !existing.clerkUserId.startsWith("invited_")) {
      return Response.json({ error: "A user with this email already exists." }, { status: 409 });
    }

    const clerk = await clerkClient();

    // Send Clerk invitation — Clerk emails the user a sign-in link automatically.
    // When they accept and sign in, the webhook creates/updates the DB row.
    const invitation = await clerk.invitations.createInvitation({
      emailAddress: body.email,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/sign-in`,
      publicMetadata: {
        tenantId: ctx.tenantId,
        role: body.role,
        name: body.name,
      },
      notify: true,
      ignoreExisting: true,
    });

    // Pre-create the DB row so the user appears in the list immediately.
    // clerkUserId is a placeholder until the webhook fires on user.created.
    const placeholderClerkId = `invited_${invitation.id}`;

    let newUser;
    if (existing) {
      // Re-invite: update existing pending row
      [newUser] = await db
        .update(users)
        .set({ name: body.name, role: body.role, clerkUserId: placeholderClerkId, isActive: false, updatedAt: new Date() })
        .where(eq(users.id, existing.id))
        .returning();
    } else {
      [newUser] = await db
        .insert(users)
        .values({
          tenantId: ctx.tenantId,
          clerkUserId: placeholderClerkId,
          email: body.email,
          name: body.name,
          role: body.role,
          isActive: false, // becomes true when they accept
        })
        .returning();
    }

    return created(newUser);
  } catch (err) {
    return handleError(err);
  }
}
