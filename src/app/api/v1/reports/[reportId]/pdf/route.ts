import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import {
  dailyReports, reportHeaders, reportCostEntries, reportModuleData,
  chartsOfAccounts, coaLineItems, jobs, wells, sites, tenants,
} from "@/db/schema";
import { getAuthContext } from "@/lib/auth/get-tenant";
import { handleError, notFound } from "@/lib/api/response";
import { generatePdfFromHtml } from "@/lib/pdf/generate";

type Params = { params: Promise<{ reportId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const ctx = await getAuthContext();
    const { reportId } = await params;

    // Fetch all report data
    const [report] = await db.select().from(dailyReports)
      .where(and(eq(dailyReports.id, reportId), eq(dailyReports.tenantId, ctx.tenantId))).limit(1);
    if (!report) return notFound("Report not found");

    const [job] = await db.select().from(jobs).where(eq(jobs.id, report.jobId)).limit(1);
    const [well] = job ? await db.select().from(wells).where(eq(wells.id, job.wellId)).limit(1) : [];
    const [site] = well ? await db.select().from(sites).where(eq(sites.id, well.siteId)).limit(1) : [];
    const [tenant] = await db.select({ name: tenants.name }).from(tenants).where(eq(tenants.id, ctx.tenantId)).limit(1);

    const [header] = await db.select().from(reportHeaders).where(eq(reportHeaders.reportId, reportId)).limit(1);
    const costs = await db.select().from(reportCostEntries).where(eq(reportCostEntries.reportId, reportId));
    const [moduleData] = await db.select().from(reportModuleData).where(eq(reportModuleData.reportId, reportId)).limit(1);

    const [coa] = await db.select().from(chartsOfAccounts)
      .where(and(eq(chartsOfAccounts.jobId, report.jobId), eq(chartsOfAccounts.tenantId, ctx.tenantId))).limit(1);
    const lineItems = coa
      ? await db.select().from(coaLineItems).where(eq(coaLineItems.coaId, coa.id)).orderBy(coaLineItems.sortOrder)
      : [];

    // Build HTML
    const reportDate = new Date(report.reportDate + "T12:00:00").toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    const timeLog: Array<Record<string, unknown>> =
      (moduleData?.data as { timeLog?: Array<Record<string, unknown>> } | null)?.timeLog ?? [];

    const costMap: Record<string, string> = {};
    for (const c of costs) { costMap[c.coaLineItemId] = c.dailyCost ?? "0"; }

    const dailyTotal = costs.reduce((s, c) => s + parseFloat(c.dailyCost ?? "0"), 0);

    function fmt(v: string | null | undefined) {
      if (!v || v === "0") return "—";
      return "$" + parseFloat(v).toLocaleString("en-US", { minimumFractionDigits: 2 });
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 10px; color: #111; line-height: 1.4; }
  h1 { font-size: 20px; font-weight: 700; }
  h2 { font-size: 12px; font-weight: 600; margin-bottom: 6px; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
  .meta { color: #6b7280; font-size: 9px; margin-top: 4px; }
  .status { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 9px; font-weight: 600;
    background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
  .status.approved { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
  section { margin-bottom: 16px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .field label { font-size: 8px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }
  .field p { font-size: 10px; margin-top: 2px; }
  .summary-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; font-size: 10px; line-height: 1.6; white-space: pre-wrap; }
  table { width: 100%; border-collapse: collapse; font-size: 9px; }
  th { text-align: left; font-size: 8px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 8px; border-bottom: 1px solid #e5e7eb; background: #f9fafb; }
  td { padding: 5px 8px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
  .total-row td { font-weight: 700; background: #f9fafb; border-top: 1px solid #e5e7eb; }
  .text-right { text-align: right; }
  .mono { font-family: 'Courier New', monospace; }
  .company { font-size: 11px; font-weight: 700; }
  .footer { margin-top: 24px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 8px; color: #9ca3af; display: flex; justify-content: space-between; }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="company">${tenant?.name ?? "Field Reporting"}</div>
    <h1>${well?.name ?? "—"} — Daily Report</h1>
    <div class="meta">${reportDate} · ${job?.name ?? ""} · ${site?.name ?? ""}</div>
  </div>
  <div style="text-align:right">
    <span class="status ${report.status}">${report.status.charAt(0).toUpperCase() + report.status.slice(1)}</span>
    <div class="meta" style="margin-top:6px">API: ${well?.apiNumber ?? "—"}</div>
  </div>
</div>

${header ? `
<section>
  <h2>Daily Header</h2>
  ${header.dailySummary ? `<div class="summary-box" style="margin-bottom:10px">${header.dailySummary}</div>` : ""}
  <div class="grid-2">
    <div class="field"><label>Measured Depth</label><p>${header.measuredDepth ? parseFloat(header.measuredDepth).toLocaleString() + " ft MD" : "—"}</p></div>
    <div class="field"><label>TVD</label><p>${header.tvd ? parseFloat(header.tvd).toLocaleString() + " ft TVD" : "—"}</p></div>
    <div class="field"><label>Days on Job</label><p>${header.daysOnJob ?? "—"}</p></div>
    <div class="field"><label>Spud Date</label><p>${header.spudDate ? new Date(header.spudDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</p></div>
  </div>
</section>` : ""}

${timeLog.length > 0 ? `
<section>
  <h2>Time Log</h2>
  <table>
    <thead><tr>
      <th>Activity</th><th>Start</th><th>End</th><th class="text-right">Hrs</th><th>Depth (ft)</th><th>Vendor</th><th>Notes</th>
    </tr></thead>
    <tbody>
      ${timeLog.map((r) => `<tr>
        <td>${r.activity ?? ""}</td>
        <td class="mono">${r.startTime ?? "—"}</td>
        <td class="mono">${r.endTime ?? "—"}</td>
        <td class="text-right mono">${typeof r.hours === "number" ? r.hours.toFixed(2) : "—"}</td>
        <td class="mono">${r.fromDepth != null && r.toDepth != null ? `${r.fromDepth}–${r.toDepth}` : "—"}</td>
        <td>${r.vendor ?? "—"}</td>
        <td>${r.notes ?? "—"}</td>
      </tr>`).join("")}
      <tr class="total-row">
        <td colspan="3"><strong>Total</strong></td>
        <td class="text-right mono"><strong>${timeLog.reduce((s, r) => s + (typeof r.hours === "number" ? r.hours : 0), 0).toFixed(2)}</strong></td>
        <td colspan="3"></td>
      </tr>
    </tbody>
  </table>
</section>` : ""}

${lineItems.length > 0 ? `
<section>
  <h2>Daily Costs</h2>
  <table>
    <thead><tr>
      <th>Category</th><th>Description</th><th class="text-right">AFE Budget</th><th class="text-right">Daily Cost</th><th class="text-right">Cumulative</th>
    </tr></thead>
    <tbody>
      ${lineItems.map((item) => {
        const cost = costs.find((c) => c.coaLineItemId === item.id);
        return `<tr>
          <td>${item.category}</td>
          <td>${item.description}</td>
          <td class="text-right">${fmt(item.afeAmount)}</td>
          <td class="text-right">${fmt(cost?.dailyCost)}</td>
          <td class="text-right">${fmt(cost?.cumulativeCost)}</td>
        </tr>`;
      }).join("")}
      <tr class="total-row">
        <td colspan="3"><strong>Daily Total</strong></td>
        <td class="text-right"><strong>$${dailyTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong></td>
        <td></td>
      </tr>
    </tbody>
  </table>
</section>` : ""}

<div class="footer">
  <span>Generated ${new Date().toLocaleString("en-US")} · Daily Field Reporting</span>
  <span>${report.reportDate}</span>
</div>
</body>
</html>`;

    const pdfBuffer = await generatePdfFromHtml(html);

    const filename = `report-${well?.name?.replace(/\s+/g, "-") ?? "unknown"}-${report.reportDate}.pdf`;

    return new NextResponse(pdfBuffer.buffer as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return handleError(err);
  }
}
