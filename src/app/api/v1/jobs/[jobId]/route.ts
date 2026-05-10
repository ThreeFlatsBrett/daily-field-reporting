import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { getAuthContext } from "@/lib/auth/get-tenant";
import { requireRole } from "@/lib/auth/permissions";
import { ok, noContent, handleError } from "@/lib/api/response";
import { NotFoundError } from "@/lib/api/errors";

type Params = { params: Promise<{ jobId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const ctx = await getAuthContext();
    const { jobId } = await params;
    const [job] = await db
      .select()
      .from(jobs)
      .where(and(eq(jobs.id, jobId), eq(jobs.tenantId, ctx.tenantId)))
      .limit(1);
    if (!job) throw new NotFoundError("Job not found");
    return ok(job);
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const ctx = await getAuthContext();
    requireRole(ctx, ["admin", "editor"]);
    const { jobId } = await params;
    const body = await req.json();

    // Strip immutable fields
    const { id, tenantId, wellId, jobNumber, createdAt, ...updateable } = body;
    void id; void tenantId; void wellId; void jobNumber; void createdAt;

    const [job] = await db
      .update(jobs)
      .set({ ...updateable, updatedAt: new Date() })
      .where(and(eq(jobs.id, jobId), eq(jobs.tenantId, ctx.tenantId)))
      .returning();
    if (!job) throw new NotFoundError("Job not found");
    return ok(job);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const ctx = await getAuthContext();
    requireRole(ctx, ["admin"]);
    const { jobId } = await params;
    await db
      .delete(jobs)
      .where(and(eq(jobs.id, jobId), eq(jobs.tenantId, ctx.tenantId)));
    return noContent();
  } catch (err) {
    return handleError(err);
  }
}
