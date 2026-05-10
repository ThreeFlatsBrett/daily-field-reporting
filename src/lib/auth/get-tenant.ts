import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users, partnerWellAccess } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AuthContext } from "@/types";
import { UnauthorizedError, ForbiddenError } from "@/lib/api/errors";

export async function getAuthContext(): Promise<AuthContext> {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    throw new UnauthorizedError();
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);

  if (!user) {
    throw new ForbiddenError("User not provisioned in this system");
  }

  let allowedWellIds: string[] = [];

  if (user.role === "partner_user") {
    const access = await db
      .select({ wellId: partnerWellAccess.wellId })
      .from(partnerWellAccess)
      .where(eq(partnerWellAccess.tenantId, user.tenantId));
    allowedWellIds = access.map((a) => a.wellId);
  }

  return {
    tenantId: user.tenantId,
    userId: user.id,
    clerkUserId,
    role: user.role,
    allowedWellIds,
  };
}

/**
 * Server-component helper: resolves auth context or redirects.
 * - Not signed in → /sign-in
 * - Signed into Clerk but not provisioned in DB → /not-provisioned
 */
export async function getAuthContextOrRedirect(): Promise<AuthContext> {
  try {
    return await getAuthContext();
  } catch (err) {
    if (err instanceof ForbiddenError) redirect("/not-provisioned");
    redirect("/sign-in");
  }
}
