import { db } from "@/db";
import { sites, wells } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthContextOrRedirect } from "@/lib/auth/get-tenant";
import { notFound } from "next/navigation";
import Link from "next/link";
import { WellsList } from "@/components/wells/wells-list";

type WellStatus = "planned" | "active" | "inactive" | "abandoned";

export default async function SiteDetailPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const ctx = await getAuthContextOrRedirect();

  const { siteId } = await params;

  const [site] = await db
    .select()
    .from(sites)
    .where(and(eq(sites.id, siteId), eq(sites.tenantId, ctx.tenantId)))
    .limit(1);

  if (!site) notFound();

  const siteWells = await db
    .select()
    .from(wells)
    .where(and(eq(wells.siteId, siteId), eq(wells.tenantId, ctx.tenantId)))
    .orderBy(wells.name);

  const location = [site.county, site.state].filter(Boolean).join(", ");

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/sites" className="hover:text-gray-900 transition-colors">
          Sites &amp; Wells
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 font-medium">{site.name}</span>
      </nav>

      {/* Site header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">{site.name}</h1>
        <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
          {location && <span>{location}</span>}
          {site.address && (
            <>
              {location && <span className="text-gray-300">·</span>}
              <span>{site.address}</span>
            </>
          )}
          {site.latitude && site.longitude && (
            <>
              <span className="text-gray-300">·</span>
              <span className="font-mono text-xs">
                {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Wells section */}
      <WellsList
        siteId={siteId}
        initialWells={siteWells.map((w) => ({
          id: w.id,
          siteId: w.siteId,
          name: w.name,
          apiNumber: w.apiNumber,
          status: w.status as WellStatus,
          spudDate: w.spudDate,
          tdDepth: w.tdDepth,
          createdAt: w.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
