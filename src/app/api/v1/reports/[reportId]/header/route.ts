import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { dailyReports, reportHeaders } from "@/db/schema";
import { getAuthContext } from "@/lib/auth/get-tenant";
import { requireRole } from "@/lib/auth/permissions";
import { z } from "zod";
import { validate } from "@/lib/api/validate";
import { ok, handleError } from "@/lib/api/response";
import { NotFoundError } from "@/lib/api/errors";

const UpsertReportHeaderSchema = z.object({
  dailySummary:  z.string().optional(),
  spudDate:      z.string().optional(),
  measuredDepth: z.string().optional(),
  tvd:           z.string().optional(),
  daysOnJob:     z.string().optional(),
});

type Params = { params: Promise<{ reportId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const ctx = await getAuthContext();
    const { reportId } = await params;

    const [report] = await db.select({ id: dailyReports.id }).from(dailyReports)
      .where(and(eq(dailyReports.id, reportId), eq(dailyReports.tenantId, ctx.tenantId))).limit(1);
    if (!report) throw new NotFoundError("Report not found");

    const [header] = await db.select().from(reportHeaders)
      .where(eq(reportHeaders.reportId, reportId)).limit(1);

    return ok(header ?? null);
  } catch (err) { return handleError(err); }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const ctx = await getAuthContext();
    requireRole(ctx, ["admin", "editor"]);
    const { reportId } = await params;
    const body = await validate(req, UpsertReportHeaderSchema);

    const [report] = await db.select({ id: dailyReports.id }).from(dailyReports)
      .where(and(eq(dailyReports.id, reportId), eq(dailyReports.tenantId, ctx.tenantId))).limit(1);
    if (!report) throw new NotFoundError("Report not found");

    const [existing] = await db.select({ id: reportHeaders.id }).from(reportHeaders)
      .where(eq(reportHeaders.reportId, reportId)).limit(1);

    const now = new Date();
    let header;
    if (existing) {
      [header] = await db.update(reportHeaders)
        .set({ ...body, updatedAt: now })
        .where(eq(reportHeaders.reportId, reportId))
        .returning();
    } else {
      [header] = await db.insert(reportHeaders)
        .values({ reportId, ...body })
        .returning();
    }

    // Touch the report updatedAt
    await db.update(dailyReports).set({ updatedAt: now }).where(eq(dailyReports.id, reportId));

    return ok(header);
  } catch (err) { return handleError(err); }
}
