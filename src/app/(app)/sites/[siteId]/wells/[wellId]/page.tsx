import { db } from "@/db";
import { sites, wells, jobs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthContextOrRedirect } from "@/lib/auth/get-tenant";
import { notFound } from "next/navigation";
import Link from "next/link";
import { JobsList } from "@/components/jobs/jobs-list";

type JobModule =
  | "location_construction" | "drilling" | "completions"
  | "production_facilities_install" | "workovers" | "re_completions"
  | "logging_testing_science" | "artificial_lift_installation";

type JobStatus = "active" | "completed" | "suspended";
type WellStatus = "planned" | "active" | "inactive" | "abandoned";

const WELL_STATUS_COLORS: Record<WellStatus, string> = {
  planned:   "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  active:    "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200",
  inactive:  "bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-200",
  abandoned: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
};

export default async function WellDetailPage({
  params,
}: {
  params: Promise<{ siteId: string; wellId: string }>;
}) {
  const ctx = await getAuthContextOrRedirect();

  const { siteId, wellId } = await params;

  // Fetch site, well, and jobs in parallel
  const [[site], [well], wellJobs] = await Promise.all([
    db.select().from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, ctx.tenantId)))
      .limit(1),
    db.select().from(wells)
      .where(and(eq(wells.id, wellId), eq(wells.tenantId, ctx.tenantId)))
      .limit(1),
    db.select().from(jobs)
      .where(and(eq(jobs.wellId, wellId), eq(jobs.tenantId, ctx.tenantId)))
      .orderBy(jobs.jobNumber),
  ]);

  if (!site || !well) notFound();

  const wellStatus = well.status as WellStatus;

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/sites" className="hover:text-gray-900 transition-colors">
          Sites &amp; Wells
        </Link>
        <span className="text-gray-300">/</span>
        <Link href={`/sites/${siteId}`} className="hover:text-gray-900 transition-colors">
          {site.name}
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 font-medium">{well.name}</span>
      </nav>

      {/* Well header */}
      <div className="mb-8">
        <div className="flex items-start gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">{well.name}</h1>
          <span className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${WELL_STATUS_COLORS[wellStatus]}`}>
            {wellStatus.charAt(0).toUpperCase() + wellStatus.slice(1)}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
          {well.apiNumber && (
            <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
              API: {well.apiNumber}
            </span>
          )}
          {well.spudDate && (
            <span>
              Spud:{" "}
              {new Date(well.spudDate + "T12:00:00").toLocaleDateString("en-US", {
                year: "numeric", month: "short", day: "numeric",
              })}
            </span>
          )}
          {well.tdDepth && (
            <span>TD: {well.tdDepth.toLocaleString()} ft MD</span>
          )}
        </div>
      </div>

      {/* Jobs section */}
      <JobsList
        wellId={wellId}
        siteId={siteId}
        initialJobs={wellJobs.map((j) => ({
          id: j.id,
          wellId: j.wellId,
          module: j.module as JobModule,
          jobNumber: j.jobNumber,
          name: j.name,
          status: j.status as JobStatus,
          startDate: j.startDate,
          endDate: j.endDate,
          distributionTime: j.distributionTime,
        }))}
      />
    </div>
  );
}
