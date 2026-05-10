import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { dailyReports, reportModuleData, jobs } from "@/db/schema";
import { getAuthContext } from "@/lib/auth/get-tenant";
import { requireRole } from "@/lib/auth/permissions";
import { z } from "zod";
import { validate } from "@/lib/api/validate";
import { ok, handleError } from "@/lib/api/response";
import { NotFoundError } from "@/lib/api/errors";

const UpsertModuleDataSchema = z.object({
  data: z.record(z.unknown()),
});

type Params = { params: Promise<{ reportId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const ctx = await getAuthContext();
    const { reportId } = await params;

    const [report] = await db.select().from(dailyReports)
      .where(and(eq(dailyReports.id, reportId), eq(dailyReports.tenantId, ctx.tenantId))).limit(1);
    if (!report) throw new NotFoundError("Report not found");

    const [moduleData] = await db.select().from(reportModuleData)
      .where(eq(reportModuleData.reportId, reportId)).limit(1);

    return ok(moduleData ?? null);
  } catch (err) { return handleError(err); }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const ctx = await getAuthContext();
    requireRole(ctx, ["admin", "editor"]);
    const { reportId } = await params;
    const body = await validate(req, UpsertModuleDataSchema);

    const [report] = await db.select({ id: dailyReports.id, jobId: dailyReports.jobId }).from(dailyReports)
      .where(and(eq(dailyReports.id, reportId), eq(dailyReports.tenantId, ctx.tenantId))).limit(1);
    if (!report) throw new NotFoundError("Report not found");

    const [job] = await db.select({ module: jobs.module }).from(jobs)
      .where(eq(jobs.id, report.jobId)).limit(1);

    const [existing] = await db.select({ id: reportModuleData.id }).from(reportModuleData)
      .where(eq(reportModuleData.reportId, reportId)).limit(1);

    const now = new Date();
    let moduleData;
    if (existing) {
      [moduleData] = await db.update(reportModuleData)
        .set({ data: body.data, updatedAt: now })
        .where(eq(reportModuleData.reportId, reportId))
        .returning();
    } else {
      [moduleData] = await db.insert(reportModuleData)
        .values({ reportId, module: job?.module ?? "drilling", data: body.data })
        .returning();
    }

    await db.update(dailyReports).set({ updatedAt: now }).where(eq(dailyReports.id, reportId));

    return ok(moduleData);
  } catch (err) { return handleError(err); }
}
