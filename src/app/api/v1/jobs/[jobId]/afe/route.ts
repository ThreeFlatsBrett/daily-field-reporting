import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { afes, jobs } from "@/db/schema";
import { getAuthContext } from "@/lib/auth/get-tenant";
import { requireRole } from "@/lib/auth/permissions";
import { ok, created, handleError } from "@/lib/api/response";
import { NotFoundError } from "@/lib/api/errors";
import { z } from "zod";
import { validate } from "@/lib/api/validate";

type Params = { params: Promise<{ jobId: string }> };

const CreateAfeSchema = z.object({
  afeNumber: z.string().min(1),
  totalBudget: z.string().optional(),
});

async function getJob(jobId: string, tenantId: string) {
  const [job] = await db.select().from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.tenantId, tenantId))).limit(1);
  if (!job) throw new NotFoundError("Job not found");
  return job;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const ctx = await getAuthContext();
    const { jobId } = await params;
    await getJob(jobId, ctx.tenantId);
    const rows = await db.select().from(afes)
      .where(and(eq(afes.jobId, jobId), eq(afes.tenantId, ctx.tenantId)))
      .orderBy(afes.createdAt);
    return ok(rows);
  } catch (err) { return handleError(err); }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const ctx = await getAuthContext();
    requireRole(ctx, ["admin", "editor"]);
    const { jobId } = await params;
    await getJob(jobId, ctx.tenantId);
    const body = await validate(req, CreateAfeSchema);
    const [afe] = await db.insert(afes).values({
      tenantId: ctx.tenantId, jobId, ...body,
    }).returning();
    return created(afe);
  } catch (err) { return handleError(err); }
}
