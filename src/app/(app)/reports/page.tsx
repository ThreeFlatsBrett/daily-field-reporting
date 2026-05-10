import { db } from "@/db";
import { dailyReports, jobs, wells, sites } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getAuthContextOrRedirect } from "@/lib/auth/get-tenant";
import Link from "next/link";
import { AllReportsList } from "@/components/reports/all-reports-list";

export default async function ReportsPage() {
  const ctx = await getAuthContextOrRedirect();

  const rows = await db
    .select({
      reportId:    dailyReports.id,
      reportDate:  dailyReports.reportDate,
      status:      dailyReports.status,
      submittedAt: dailyReports.submittedAt,
      jobId:       jobs.id,
      jobName:     jobs.name,
      wellId:      wells.id,
      wellName:    wells.name,
      siteId:      sites.id,
      siteName:    sites.name,
    })
    .from(dailyReports)
    .innerJoin(jobs,  eq(dailyReports.jobId, jobs.id))
    .innerJoin(wells, eq(jobs.wellId, wells.id))
    .innerJoin(sites, eq(wells.siteId, sites.id))
    .where(eq(dailyReports.tenantId, ctx.tenantId))
    .orderBy(desc(dailyReports.reportDate), desc(dailyReports.id));

  const isAdmin = ctx.role === "admin";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">All daily reports across every job.</p>
      </div>

      <AllReportsList
        initialRows={rows.map((r) => ({
          reportId:    r.reportId,
          reportDate:  r.reportDate,
          status:      r.status as "draft" | "submitted" | "approved" | "rejected",
          submittedAt: r.submittedAt?.toISOString() ?? null,
          jobId:       r.jobId,
          jobName:     r.jobName,
          wellId:      r.wellId,
          wellName:    r.wellName,
          siteId:      r.siteId,
          siteName:    r.siteName,
        }))}
        isAdmin={isAdmin}
      />
    </div>
  );
}
