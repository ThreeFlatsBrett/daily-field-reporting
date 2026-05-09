import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { sites } from "@/db/schema";
import { getAuthContext } from "@/lib/auth/get-tenant";
import { requireRole } from "@/lib/auth/permissions";
import { ok, noContent, handleError } from "@/lib/api/response";
import { NotFoundError } from "@/lib/api/errors";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ siteId: string }> }) {
  try {
    const ctx = await getAuthContext();
    const { siteId } = await params;
    const [site] = await db.select().from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, ctx.tenantId)))
      .limit(1);
    if (!site) throw new NotFoundError("Site not found");
    return ok(site);
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ siteId: string }> }) {
  try {
    const ctx = await getAuthContext();
    requireRole(ctx, ["admin"]);
    const { siteId } = await params;
    const body = await req.json();
    const [site] = await db.update(sites)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, ctx.tenantId)))
      .returning();
    if (!site) throw new NotFoundError("Site not found");
    return ok(site);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ siteId: string }> }) {
  try {
    const ctx = await getAuthContext();
    requireRole(ctx, ["admin"]);
    const { siteId } = await params;
    await db.delete(sites).where(and(eq(sites.id, siteId), eq(sites.tenantId, ctx.tenantId)));
    return noContent();
  } catch (err) {
    return handleError(err);
  }
}
