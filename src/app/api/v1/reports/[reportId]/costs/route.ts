import { NextRequest } from "next/server";
import { eq, and, lte, inArray } from "drizzle-orm";
import { db } from "@/db";
import { dailyReports, reportCostEntries } from "@/db/schema";
import { getAuthContext } from "@/lib/auth/get-tenant";
import { requireRole } from "@/lib/auth/permissions";
import { z } from "zod";
import { validate } from "@/lib/api/validate";
import { ok, handleError } from "@/lib/api/response";
import { NotFoundError } from "@/lib/api/errors";

const UpsertCostEntriesSchema = z.object({
  entries: z.array(z.object({
    coaLineItemId: z.string().uuid(),
    dailyCost:     z.string(),
  })),
});

type Params = { params: Promise<{ reportId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const ctx = await getAuthContext();
    const { reportId } = await params;

    const [report] = await db.select().from(dailyReports)
      .where(and(eq(dailyReports.id, reportId), eq(dailyReports.tenantId, ctx.tenantId))).limit(1);
    if (!report) throw new NotFoundError("Report not found");

    const costs = await db.select().from(reportCostEntries)
      .where(eq(reportCostEntries.reportId, reportId));

    return ok(costs);
  } catch (err) { return handleError(err); }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const ctx = await getAuthContext();
    requireRole(ctx, ["admin", "editor"]);
    const { reportId } = await params;
    const body = await validate(req, UpsertCostEntriesSchema);

    const [report] = await db.select().from(dailyReports)
      .where(and(eq(dailyReports.id, reportId), eq(dailyReports.tenantId, ctx.tenantId))).limit(1);
    if (!report) throw new NotFoundError("Report not found");

    // Get all prior reports for this job up to this report's date (for cumulative)
    const priorReports = await db.select({ id: dailyReports.id }).from(dailyReports)
      .where(and(
        eq(dailyReports.jobId, report.jobId),
        lte(dailyReports.reportDate, report.reportDate),
      ));
    const priorReportIds = priorReports.map((r) => r.id);

    // Upsert each entry
    const now = new Date();
    const results = [];
    for (const entry of body.entries) {
      // Compute cumulative: sum of daily_cost for same line item across prior reports (excluding current)
      let cumulative = parseFloat(entry.dailyCost) || 0;
      if (priorReportIds.length > 1) {
        const otherIds = priorReportIds.filter((id) => id !== reportId);
        if (otherIds.length > 0) {
          const prior = await db.select({ dailyCost: reportCostEntries.dailyCost })
            .from(reportCostEntries)
            .where(and(
              eq(reportCostEntries.coaLineItemId, entry.coaLineItemId),
              inArray(reportCostEntries.reportId, otherIds),
            ));
          const priorSum = prior.reduce((s, r) => s + parseFloat(r.dailyCost ?? "0"), 0);
          cumulative = priorSum + (parseFloat(entry.dailyCost) || 0);
        }
      }

      const [row] = await db.insert(reportCostEntries).values({
        reportId,
        coaLineItemId: entry.coaLineItemId,
        dailyCost: entry.dailyCost,
        cumulativeCost: cumulative.toFixed(2),
        updatedAt: now,
      }).onConflictDoUpdate({
        target: [reportCostEntries.reportId, reportCostEntries.coaLineItemId],
        set: {
          dailyCost: entry.dailyCost,
          cumulativeCost: cumulative.toFixed(2),
          updatedAt: now,
        },
      }).returning();
      results.push(row);
    }

    // Touch the report updatedAt
    await db.update(dailyReports).set({ updatedAt: now }).where(eq(dailyReports.id, reportId));

    return ok(results);
  } catch (err) { return handleError(err); }
}
