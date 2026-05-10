import { NextRequest } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthContext } from "@/lib/auth/get-tenant";
import { requireRole } from "@/lib/auth/permissions";
import { ok, noContent, handleError } from "@/lib/api/response";
import { validate } from "@/lib/api/validate";
import { UpdateUserRoleSchema } from "@/types/api";
import { NotFoundError, BadRequestError } from "@/lib/api/errors";

type Params = { params: Promise<{ userId: string }> };

// GET /api/v1/users/[userId]
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const ctx = await getAuthContext();
    requireRole(ctx, ["admin"]);
    const { userId } = await params;

    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), eq(users.tenantId, ctx.tenantId)))
      .limit(1);

    if (!user) throw new NotFoundError("User not found");

    return ok(user);
  } catch (err) {
    return handleError(err);
  }
}

// PATCH /api/v1/users/[userId] — update role
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const ctx = await getAuthContext();
    requireRole(ctx, ["admin"]);
    const { userId } = await params;

    const body = await validate(req, UpdateUserRoleSchema);

    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), eq(users.tenantId, ctx.tenantId)))
      .limit(1);

    if (!user) throw new NotFoundError("User not found");

    // Prevent demoting yourself
    if (user.id === ctx.userId) {
      throw new BadRequestError("You cannot change your own role");
    }

    // Update Clerk publicMetadata
    const clerk = await clerkClient();
    await clerk.users.updateUser(user.clerkUserId, {
      publicMetadata: {
        tenantId: ctx.tenantId,
        role: body.role,
      },
    });

    // Update our DB
    const [updated] = await db
      .update(users)
      .set({ role: body.role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    return ok(updated);
  } catch (err) {
    return handleError(err);
  }
}

// DELETE /api/v1/users/[userId] — deactivate (ban in Clerk + mark inactive in DB)
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const ctx = await getAuthContext();
    requireRole(ctx, ["admin"]);
    const { userId } = await params;

    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), eq(users.tenantId, ctx.tenantId)))
      .limit(1);

    if (!user) throw new NotFoundError("User not found");

    if (user.id === ctx.userId) {
      throw new BadRequestError("You cannot deactivate your own account");
    }

    const clerk = await clerkClient();

    if (user.isActive) {
      // Deactivate: ban in Clerk
      await clerk.users.banUser(user.clerkUserId);
      await db
        .update(users)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(users.id, userId));
    } else {
      // Reactivate: unban in Clerk
      await clerk.users.unbanUser(user.clerkUserId);
      await db
        .update(users)
        .set({ isActive: true, updatedAt: new Date() })
        .where(eq(users.id, userId));
    }

    return noContent();
  } catch (err) {
    return handleError(err);
  }
}
