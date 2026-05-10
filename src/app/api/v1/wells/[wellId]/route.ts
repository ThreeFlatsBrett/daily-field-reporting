import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { wells } from "@/db/schema";
import { getAuthContext } from "@/lib/auth/get-tenant";
import { requireRole } from "@/lib/auth/permissions";
import { ok, noContent, handleError } from "@/lib/api/response";
import { NotFoundError } from "@/lib/api/errors";

type Params = { params: Promise<{ wellId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const ctx = await getAuthContext();
    const { wellId } = await params;
    const [well] = await db
      .select()
      .from(wells)
      .where(and(eq(wells.id, wellId), eq(wells.tenantId, ctx.tenantId)))
      .limit(1);
    if (!well) throw new NotFoundError("Well not found");
    return ok(well);
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const ctx = await getAuthContext();
    requireRole(ctx, ["admin", "editor"]);
    const { wellId } = await params;
    const body = await req.json();

    // Strip fields that shouldn't be updated directly
    const { id, tenantId, siteId, createdAt, ...updateable } = body;
    void id; void tenantId; void siteId; void createdAt;

    const [well] = await db
      .update(wells)
      .set({ ...updateable, updatedAt: new Date() })
      .where(and(eq(wells.id, wellId), eq(wells.tenantId, ctx.tenantId)))
      .returning();
    if (!well) throw new NotFoundError("Well not found");
    return ok(well);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const ctx = await getAuthContext();
    requireRole(ctx, ["admin"]);
    const { wellId } = await params;
    await db
      .delete(wells)
      .where(and(eq(wells.id, wellId), eq(wells.tenantId, ctx.tenantId)));
    return noContent();
  } catch (err) {
    return handleError(err);
  }
}
