import { db } from "@/db";
import { sites, wells, jobs, dailyReports, reportHeaders, reportCostEntries, reportModuleData, chartsOfAccounts, coaLineItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthContextOrRedirect } from "@/lib/auth/get-tenant";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ReportHeaderForm } from "@/components/reports/report-header-form";
import { TimeLogForm } from "@/components/reports/time-log-form";
import { CostReportForm } from "@/components/reports/cost-report-form";
import { SubmitButton } from "@/components/reports/submit-button";
import { ApproveRejectButtons } from "@/components/reports/approve-reject-buttons";

type ReportStatus = "draft" | "submitted" | "approved" | "rejected";

const STATUS_COLORS: Record<ReportStatus, string> = {
  draft:     "bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-200",
  submitted: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  approved:  "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200",
  rejected:  "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
};

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ siteId: string; wellId: string; jobId: string; reportId: string }>;
}) {
  const ctx = await getAuthContextOrRedirect();

  const { siteId, wellId, jobId, reportId } = await params;

  const [[site], [well], [job], [report]] = await Promise.all([
    db.select({ id: sites.id, name: sites.name }).from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, ctx.tenantId))).limit(1),
    db.select({ id: wells.id, name: wells.name }).from(wells)
      .where(and(eq(wells.id, wellId), eq(wells.tenantId, ctx.tenantId))).limit(1),
    db.select().from(jobs)
      .where(and(eq(jobs.id, jobId), eq(jobs.tenantId, ctx.tenantId))).limit(1),
    db.select().from(dailyReports)
      .where(and(eq(dailyReports.id, reportId), eq(dailyReports.tenantId, ctx.tenantId))).limit(1),
  ]);

  if (!site || !well || !job || !report) notFound();

  const [header, moduleData, coaResult, costEntries] = await Promise.all([
    db.select().from(reportHeaders).where(eq(reportHeaders.reportId, reportId)).limit(1).then(r => r[0] ?? null),

    db.select().from(reportModuleData).where(eq(reportModuleData.reportId, reportId)).limit(1).then(r => r[0] ?? null),

    db.select().from(chartsOfAccounts)
      .where(and(eq(chartsOfAccounts.jobId, jobId), eq(chartsOfAccounts.tenantId, ctx.tenantId)))
      .limit(1)
      .then(async ([coa]) => {
        if (!coa) return { lineItems: [] };
        const items = await db.select().from(coaLineItems).where(eq(coaLineItems.coaId, coa.id))
          .orderBy(coaLineItems.sortOrder, coaLineItems.createdAt);
        return { lineItems: items };
      }),

    db.select().from(reportCostEntries).where(eq(reportCostEntries.reportId, reportId)),
  ]);

  const reportDate = new Date(report.reportDate + "T12:00:00");
  const reportStatus = report.status as ReportStatus;
  const isEditable = reportStatus === "draft" || reportStatus === "rejected";
  const isAdmin = ctx.role === "admin";
  const reportsListUrl = `/sites/${siteId}/wells/${wellId}/jobs/${jobId}/reports`;

  // Build cost map for initial values
  const costMap: Record<string, string> = {};
  for (const c of costEntries) {
    costMap[c.coaLineItemId] = c.dailyCost ?? "0";
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6 flex-wrap">
        <Link href="/sites" className="hover:text-gray-900 transition-colors">Sites &amp; Wells</Link>
        <span className="text-gray-300">/</span>
        <Link href={`/sites/${siteId}`} className="hover:text-gray-900 transition-colors">{site.name}</Link>
        <span className="text-gray-300">/</span>
        <Link href={`/sites/${siteId}/wells/${wellId}`} className="hover:text-gray-900 transition-colors">{well.name}</Link>
        <span className="text-gray-300">/</span>
        <Link href={`/sites/${siteId}/wells/${wellId}/jobs/${jobId}`} className="hover:text-gray-900 transition-colors">{job.name}</Link>
        <span className="text-gray-300">/</span>
        <Link href={`/sites/${siteId}/wells/${wellId}/jobs/${jobId}/reports`} className="hover:text-gray-900 transition-colors">Reports</Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 font-medium">
          {reportDate.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
        </span>
      </nav>

      {/* Report header */}
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-900">
              {reportDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </h1>
            <span className={`mt-0.5 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[reportStatus]}`}>
              {reportStatus.charAt(0).toUpperCase() + reportStatus.slice(1)}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{job.name} · Report for {reportDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
          {report.rejectionNote && (
            <p className="mt-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-100">
              <span className="font-medium">Rejected:</span> {report.rejectionNote}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          {/* PDF download link */}
          <a
            href={`/api/v1/reports/${reportId}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            ↓ Download PDF
          </a>
          {/* Action buttons */}
          {isEditable && (
            <SubmitButton reportId={reportId} jobId={jobId} siteId={siteId} wellId={wellId} />
          )}
          {isAdmin && reportStatus === "submitted" && (
            <ApproveRejectButtons reportId={reportId} backUrl={reportsListUrl} />
          )}
        </div>
      </div>

      {/* Form sections */}
      <div className="space-y-6">
        <ReportHeaderForm
          reportId={reportId}
          isEditable={isEditable}
          initial={{
            dailySummary:  header?.dailySummary  ?? "",
            spudDate:      header?.spudDate      ?? "",
            measuredDepth: header?.measuredDepth ?? "",
            tvd:           header?.tvd           ?? "",
            daysOnJob:     header?.daysOnJob     ?? "",
          }}
        />

        <TimeLogForm
          reportId={reportId}
          isEditable={isEditable}
          initialData={(moduleData?.data as { timeLog?: TimeLogEntry[] } | null)?.timeLog ?? []}
        />

        {coaResult.lineItems.length > 0 && (
          <CostReportForm
            reportId={reportId}
            isEditable={isEditable}
            lineItems={coaResult.lineItems.map((i) => ({
              id: i.id,
              category: i.category,
              description: i.description,
              afeAmount: i.afeAmount,
            }))}
            initialCosts={costMap}
          />
        )}
      </div>
    </div>
  );
}

interface TimeLogEntry {
  activity: string;
  startTime: string;
  endTime: string;
  hours: number;
  fromDepth?: number;
  toDepth?: number;
  vendor?: string;
  notes?: string;
}
