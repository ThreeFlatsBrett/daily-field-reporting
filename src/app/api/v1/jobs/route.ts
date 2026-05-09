import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { jobs, wells } from "@/db/schema";
import { getAuthContext } from "@/lib/auth/get-tenant";
import { requireRole, assertWellAccess } from "@/lib/auth/permissions";
import { validate } from "@/lib/api/validate";
import { ok, created, handleError } from "@/lib/api/response";
import { CreateJobSchema } from "@/types/api";
import { BadRequestError } from "@/lib/api/errors";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const ctx = await getAuthContext();
    const rows = await db.select().from(jobs).where(eq(jobs.tenantId, ctx.tenantId));
    return ok(rows);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    requireRole(ctx, ["admin"]);
    const body = await validate(req, CreateJobSchema);

    const [well] = await db.select().from(wells)
      .where(and(eq(wells.id, body.wellId), eq(wells.tenantId, ctx.tenantId)))
      .limit(1);
    if (!well) throw new BadRequestError("Well not found");

    assertWellAccess(ctx, body.wellId);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(jobs)
      .where(eq(jobs.wellId, body.wellId));
    const jobNumber = (countResult?.count ?? 0) + 1;

    const [job] = await db.insert(jobs).values({
      ...body,
      tenantId: ctx.tenantId,
      jobNumber,
    }).returning();

    return created(job);
  } catch (err) {
    return handleError(err);
  }
}
