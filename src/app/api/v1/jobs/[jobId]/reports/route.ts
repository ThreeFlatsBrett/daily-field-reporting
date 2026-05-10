import { NextRequest } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { dailyReports, jobs } from "@/db/schema";
import { getAuthContext } from "@/lib/auth/get-tenant";
import { requireRole } from "@/lib/auth/permissions";
import { validate } from "@/lib/api/validate";
import { ok, created, handleError } from "@/lib/api/response";
import { NotFoundError } from "@/lib/api/errors";

const CreateJobReportSchema = z.object({
  reportDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
});

type Params = { params: Promise<{ jobId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const ctx = await getAuthContext();
    const { jobId } = await params;

    const [job] = await db.select({ id: jobs.id }).from(jobs)
      .where(and(eq(jobs.id, jobId), eq(jobs.tenantId, ctx.tenantId))).limit(1);
    if (!job) throw new NotFoundError("Job not found");

    const rows = await db.select().from(dailyReports)
      .where(and(eq(dailyReports.jobId, jobId), eq(dailyReports.tenantId, ctx.tenantId)))
      .orderBy(desc(dailyReports.reportDate));

    return ok(rows);
  } catch (err) { return handleError(err); }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const ctx = await getAuthContext();
    requireRole(ctx, ["admin", "editor"]);
    const { jobId } = await params;
    const body = await validate(req, CreateJobReportSchema);

    const [job] = await db.select().from(jobs)
      .where(and(eq(jobs.id, jobId), eq(jobs.tenantId, ctx.tenantId))).limit(1);
    if (!job) throw new NotFoundError("Job not found");

    const [report] = await db.insert(dailyReports).values({
      tenantId: ctx.tenantId,
      jobId,
      reportDate: body.reportDate,
      status: "draft",
    }).returning();

    return created(report);
  } catch (err) { return handleError(err); }
}
