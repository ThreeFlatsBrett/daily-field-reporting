import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { vendors } from "@/db/schema";
import { getAuthContext } from "@/lib/auth/get-tenant";
import { requireRole } from "@/lib/auth/permissions";
import { ok, noContent, handleError } from "@/lib/api/response";
import { NotFoundError } from "@/lib/api/errors";

type Params = { params: Promise<{ vendorId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const ctx = await getAuthContext();
    requireRole(ctx, ["admin"]);
    const { vendorId } = await params;
    const body = await req.json();
    const { id, tenantId, createdAt, ...updateable } = body;
    void id; void tenantId; void createdAt;
    const [vendor] = await db
      .update(vendors)
      .set({ ...updateable, updatedAt: new Date() })
      .where(and(eq(vendors.id, vendorId), eq(vendors.tenantId, ctx.tenantId)))
      .returning();
    if (!vendor) throw new NotFoundError("Vendor not found");
    return ok(vendor);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const ctx = await getAuthContext();
    requireRole(ctx, ["admin"]);
    const { vendorId } = await params;
    await db.delete(vendors).where(and(eq(vendors.id, vendorId), eq(vendors.tenantId, ctx.tenantId)));
    return noContent();
  } catch (err) {
    return handleError(err);
  }
}
