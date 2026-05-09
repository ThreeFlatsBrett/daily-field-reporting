import "dotenv/config";
import { db } from "./index";
import { tenants, users, sites, wells, jobs } from "./schema";

async function seed() {
  console.log("Seeding database...");

  const [tenant] = await db.insert(tenants).values({
    name: "Acme Energy",
    slug: "acme-energy",
    timezone: "America/Chicago",
  }).returning();

  console.log("Created tenant:", tenant.id);

  const [adminUser] = await db.insert(users).values({
    tenantId: tenant.id,
    clerkUserId: "user_seed_admin",
    email: "admin@acme-energy.com",
    name: "Admin User",
    role: "admin",
  }).returning();

  console.log("Created admin user:", adminUser.id);

  const [site] = await db.insert(sites).values({
    tenantId: tenant.id,
    name: "Section 12 Pad A",
    county: "Reeves",
    state: "TX",
  }).returning();

  console.log("Created site:", site.id);

  const [well] = await db.insert(wells).values({
    tenantId: tenant.id,
    siteId: site.id,
    name: "Acme 12-1H",
    apiNumber: "42-389-12345-00-00",
    status: "active",
  }).returning();

  console.log("Created well:", well.id);

  const [job] = await db.insert(jobs).values({
    tenantId: tenant.id,
    wellId: well.id,
    module: "drilling",
    jobNumber: 1,
    name: "Drilling Job #1",
    status: "active",
    startDate: new Date().toISOString().split("T")[0],
    distributionTime: "06:00",
  }).returning();

  console.log("Created job:", job.id);
  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
