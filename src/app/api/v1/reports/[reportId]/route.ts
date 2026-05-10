import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { dailyReports, reportHeaders, reportCostEntries, reportModuleData, coaLineItems, chartsOfAccounts } from "@/db/schema";
import { getAuthContext } from "@/lib/auth/get-tenant";
import { ok, handleError } from "@/lib/api/response";
import { NotFoundError } from "@/lib/api/errors";

type Params = { params: Promise<{ reportId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const ctx = await getAuthContext();
    const { reportId } = await params;

    const [report] = await db.select().from(dailyReports)
      .where(and(eq(dailyReports.id, reportId), eq(dailyReports.tenantId, ctx.tenantId)))
      .limit(1);
    if (!report) throw new NotFoundError("Report not found");

    const [header] = await db.select().from(reportHeaders)
      .where(eq(reportHeaders.reportId, reportId)).limit(1);

    const costs = await db.select().from(reportCostEntries)
      .where(eq(reportCostEntries.reportId, reportId));

    const [moduleData] = await db.select().from(reportModuleData)
      .where(eq(reportModuleData.reportId, reportId)).limit(1);

    // Get COA line items for this job so costs can be cross-referenced
    const [coa] = await db.select().from(chartsOfAccounts)
      .where(and(eq(chartsOfAccounts.jobId, report.jobId), eq(chartsOfAccounts.tenantId, ctx.tenantId)))
      .limit(1);

    const lineItems = coa
      ? await db.select().from(coaLineItems).where(eq(coaLineItems.coaId, coa.id))
          .orderBy(coaLineItems.sortOrder, coaLineItems.createdAt)
      : [];

    return ok({ report, header: header ?? null, costs, moduleData: moduleData ?? null, lineItems });
  } catch (err) { return handleError(err); }
}
