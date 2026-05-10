import { db } from "@/db";
import { vendors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthContextOrRedirect } from "@/lib/auth/get-tenant";
import { VendorsList } from "@/components/vendors/vendors-list";

export default async function VendorsPage() {
  const ctx = await getAuthContextOrRedirect();

  const allVendors = await db
    .select()
    .from(vendors)
    .where(eq(vendors.tenantId, ctx.tenantId))
    .orderBy(vendors.name);

  return (
    <VendorsList
      initialVendors={allVendors.map((v) => ({
        id: v.id,
        name: v.name,
        category: v.category,
        contactName: v.contactName,
        contactPhone: v.contactPhone,
        contactEmail: v.contactEmail,
      }))}
    />
  );
}
