import { db } from "@/db";
import { sites, wells } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthContextOrRedirect } from "@/lib/auth/get-tenant";
import { SitesList } from "@/components/sites/sites-list";

export default async function SitesPage() {
  const ctx = await getAuthContextOrRedirect();

  // Fetch sites + well counts in parallel
  const [allSites, allWells] = await Promise.all([
    db.select().from(sites).where(eq(sites.tenantId, ctx.tenantId)).orderBy(sites.name),
    db.select({ siteId: wells.siteId }).from(wells).where(eq(wells.tenantId, ctx.tenantId)),
  ]);

  // Build wellCount map: siteId → count
  const wellCounts: Record<string, number> = {};
  for (const { siteId } of allWells) {
    wellCounts[siteId] = (wellCounts[siteId] ?? 0) + 1;
  }

  return (
    <SitesList
      initialSites={allSites.map((s) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
      }))}
      wellCounts={wellCounts}
    />
  );
}
