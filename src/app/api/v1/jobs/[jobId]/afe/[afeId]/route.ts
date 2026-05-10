import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { afes } from "@/db/schema";
import { getAuthContext } from "@/lib/auth/get-tenant";
import { requireRole } from "@/lib/auth/permissions";
import { ok, noContent, handleError } from "@/lib/api/response";
import { NotFoundError } from "@/lib/api/errors";

type Params = { params: Promise<{ jobId: string; afeId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const ctx = await getAuthContext();
    requireRole(ctx, ["admin", "editor"]);
    const { afeId } = await params;
    const body = await req.json();
    const { id, tenantId, jobId, createdAt, ...updateable } = body;
    void id; void tenantId; void jobId; void createdAt;
    const [afe] = await db.update(afes)
      .set({ ...updateable, updatedAt: new Date() })
      .where(and(eq(afes.id, afeId), eq(afes.tenantId, ctx.tenantId)))
      .returning();
    if (!afe) throw new NotFoundError("AFE not found");
    return ok(afe);
  } catch (err) { return handleError(err); }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const ctx = await getAuthContext();
    requireRole(ctx, ["admin"]);
    const { afeId } = await params;
    await db.delete(afes).where(and(eq(afes.id, afeId), eq(afes.tenantId, ctx.tenantId)));
    return noContent();
  } catch (err) { return handleError(err); }
}
