/**
 * POST /api/v1/bootstrap
 *
 * Creates the first tenant + admin user. Only callable when the tenants table
 * is empty. Requires the caller to be signed into Clerk (so we can get their
 * clerkUserId) but skips the normal getAuthContext() since no user/tenant
 * records exist yet.
 */
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db";
import { tenants, users } from "@/db/schema";
import { ok, handleError } from "@/lib/api/response";
import { validate } from "@/lib/api/validate";
import { BootstrapSchema } from "@/types/api";
import { BadRequestError, UnauthorizedError } from "@/lib/api/errors";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) throw new UnauthorizedError();

    const body = await validate(req, BootstrapSchema);

    // Safety check — only allow when no tenants exist
    const existing = await db.select().from(tenants).limit(1);
    if (existing.length > 0) {
      throw new BadRequestError(
        "Setup is already complete. Contact your administrator."
      );
    }

    // Get the Clerk user's email
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(clerkUserId);
    const email =
      clerkUser.emailAddresses.find(
        (e) => e.id === clerkUser.primaryEmailAddressId
      )?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;

    if (!email) {
      throw new BadRequestError("No email address on Clerk account");
    }

    // Generate a unique slug
    const baseSlug = slugify(body.tenantName);
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    // Create tenant
    const [tenant] = await db
      .insert(tenants)
      .values({
        name: body.tenantName,
        slug,
      })
      .returning();

    // Create user record
    const [user] = await db
      .insert(users)
      .values({
        tenantId: tenant.id,
        clerkUserId,
        email,
        name: body.adminName,
        role: "admin",
        isActive: true,
      })
      .returning();

    // Write tenantId + role into Clerk publicMetadata so getAuthContext works
    await clerk.users.updateUser(clerkUserId, {
      publicMetadata: {
        tenantId: tenant.id,
        role: "admin",
      },
    });

    return ok({ tenant, user });
  } catch (err) {
    return handleError(err);
  }
}

// GET — check if bootstrap is needed (no auth required by middleware,
// but we open it publicly so the setup page can decide whether to show itself)
export async function GET() {
  try {
    const existing = await db.select().from(tenants).limit(1);
    return ok({ needsSetup: existing.length === 0 });
  } catch (err) {
    return handleError(err);
  }
}
