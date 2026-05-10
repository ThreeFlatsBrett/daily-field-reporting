import { db } from "@/db";
import { sites, wells, jobs, dailyReports } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getAuthContextOrRedirect } from "@/lib/auth/get-tenant";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ReportList } from "@/components/reports/report-list";

type ReportStatus = "draft" | "submitted" | "approved" | "rejected";

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ siteId: string; wellId: string; jobId: string }>;
}) {
  const ctx = await getAuthContextOrRedirect();

  const { siteId, wellId, jobId } = await params;

  const [[site], [well], [job]] = await Promise.all([
    db.select({ id: sites.id, name: sites.name }).from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, ctx.tenantId))).limit(1),
    db.select({ id: wells.id, name: wells.name }).from(wells)
      .where(and(eq(wells.id, wellId), eq(wells.tenantId, ctx.tenantId))).limit(1),
    db.select().from(jobs)
      .where(and(eq(jobs.id, jobId), eq(jobs.tenantId, ctx.tenantId))).limit(1),
  ]);

  if (!site || !well || !job) notFound();

  const reports = await db.select().from(dailyReports)
    .where(and(eq(dailyReports.jobId, jobId), eq(dailyReports.tenantId, ctx.tenantId)))
    .orderBy(desc(dailyReports.reportDate));

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
        <span className="text-gray-900 font-medium">Reports</span>
      </nav>

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Daily Reports</h1>
          <p className="text-sm text-gray-500 mt-1">{job.name}</p>
        </div>
      </div>

      <ReportList
        jobId={jobId}
        siteId={siteId}
        wellId={wellId}
        initialReports={reports.map((r) => ({
          id: r.id,
          reportDate: r.reportDate,
          status: r.status as ReportStatus,
          submittedAt: r.submittedAt?.toISOString() ?? null,
          createdAt: r.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
