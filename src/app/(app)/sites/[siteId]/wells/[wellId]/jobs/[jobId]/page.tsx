import { db } from "@/db";
import { sites, wells, jobs, afes, chartsOfAccounts, coaLineItems, distributionLists, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthContextOrRedirect } from "@/lib/auth/get-tenant";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AfeSection } from "@/components/jobs/afe-section";
import { CoaSection } from "@/components/jobs/coa-section";
import { DistributionSection } from "@/components/jobs/distribution-section";

type JobModule =
  | "location_construction" | "drilling" | "completions"
  | "production_facilities_install" | "workovers" | "re_completions"
  | "logging_testing_science" | "artificial_lift_installation";

type JobStatus = "active" | "completed" | "suspended";

const MODULE_LABELS: Record<JobModule, string> = {
  location_construction:         "Location Construction",
  drilling:                      "Drilling",
  completions:                   "Completions",
  production_facilities_install: "Production Facilities Install",
  workovers:                     "Workovers",
  re_completions:                "Re-Completions",
  logging_testing_science:       "Logging / Testing / Science",
  artificial_lift_installation:  "Artificial Lift Installation",
};

const STATUS_COLORS: Record<JobStatus, string> = {
  active:    "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200",
  completed: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  suspended: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
};

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ siteId: string; wellId: string; jobId: string }>;
}) {
  const ctx = await getAuthContextOrRedirect();

  const { siteId, wellId, jobId } = await params;

  // Fetch everything in parallel
  const [[site], [well], [job]] = await Promise.all([
    db.select({ id: sites.id, name: sites.name }).from(sites)
      .where(and(eq(sites.id, siteId), eq(sites.tenantId, ctx.tenantId))).limit(1),
    db.select({ id: wells.id, name: wells.name }).from(wells)
      .where(and(eq(wells.id, wellId), eq(wells.tenantId, ctx.tenantId))).limit(1),
    db.select().from(jobs)
      .where(and(eq(jobs.id, jobId), eq(jobs.tenantId, ctx.tenantId))).limit(1),
  ]);

  if (!site || !well || !job) notFound();

  // Fetch job config data in parallel
  const [jobAfes, coaResult, distEntries, tenantUsers] = await Promise.all([
    db.select().from(afes)
      .where(and(eq(afes.jobId, jobId), eq(afes.tenantId, ctx.tenantId)))
      .orderBy(afes.createdAt),

    // Get COA + line items (auto-create handled in API, here we just check if exists)
    db.select().from(chartsOfAccounts)
      .where(and(eq(chartsOfAccounts.jobId, jobId), eq(chartsOfAccounts.tenantId, ctx.tenantId)))
      .limit(1)
      .then(async ([coa]) => {
        if (!coa) return { coa: null, lineItems: [] };
        const lineItems = await db.select().from(coaLineItems)
          .where(eq(coaLineItems.coaId, coa.id))
          .orderBy(coaLineItems.sortOrder, coaLineItems.createdAt);
        return { coa, lineItems };
      }),

    db.select().from(distributionLists)
      .where(eq(distributionLists.jobId, jobId))
      .orderBy(distributionLists.createdAt),

    db.select({ id: users.id, name: users.name, email: users.email, clerkUserId: users.clerkUserId })
      .from(users)
      .where(eq(users.tenantId, ctx.tenantId))
      .orderBy(users.name),
  ]);

  const jobStatus = job.status as JobStatus;
  const jobModule = job.module as JobModule;

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
        <span className="text-gray-900 font-medium">{job.name}</span>
      </nav>

      {/* Job header */}
      <div className="mb-8">
        <div className="flex items-start gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold text-gray-900">{job.name}</h1>
          <span className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[jobStatus]}`}>
            {jobStatus.charAt(0).toUpperCase() + jobStatus.slice(1)}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
          <span className="font-medium text-gray-700">{MODULE_LABELS[jobModule]}</span>
          <span className="text-gray-300">·</span>
          <span>Job #{job.jobNumber}</span>
          <span className="text-gray-300">·</span>
          <span>
            Started{" "}
            {new Date(job.startDate + "T12:00:00").toLocaleDateString("en-US", {
              year: "numeric", month: "short", day: "numeric",
            })}
          </span>
          <span className="text-gray-300">·</span>
          <span>Dist. {job.distributionTime}</span>
        </div>
      </div>

      {/* Reports link */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-gray-500">Configure this job before creating daily reports.</p>
        <Link
          href={`/sites/${siteId}/wells/${wellId}/jobs/${jobId}/reports`}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
        >
          View reports →
        </Link>
      </div>

      {/* Config sections */}
      <div className="space-y-6">
        <AfeSection
          jobId={jobId}
          initialAfes={jobAfes.map((a) => ({
            id: a.id,
            afeNumber: a.afeNumber,
            totalBudget: a.totalBudget,
          }))}
        />

        <CoaSection
          jobId={jobId}
          initialLineItems={coaResult.lineItems.map((i) => ({
            id: i.id,
            category: i.category,
            description: i.description,
            afeId: i.afeId,
            afeAmount: i.afeAmount,
            sortOrder: i.sortOrder,
          }))}
          afes={jobAfes.map((a) => ({ id: a.id, afeNumber: a.afeNumber }))}
        />

        <DistributionSection
          jobId={jobId}
          initialEntries={distEntries.map((d) => ({
            id: d.id,
            type: d.type as "internal" | "partner_company" | "external_email",
            email: d.email,
            displayName: d.displayName,
            referenceId: d.referenceId,
          }))}
          internalUsers={tenantUsers}
        />
      </div>
    </div>
  );
}
