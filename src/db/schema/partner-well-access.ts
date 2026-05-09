import { pgTable, uuid, jsonb, timestamp, index, unique } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { partnerCompanies } from "./partners";
import { wells } from "./wells";

export const partnerWellAccess = pgTable(
  "partner_well_access",
  {
    id:                  uuid("id").primaryKey().defaultRandom(),
    tenantId:            uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    partnerCompanyId:    uuid("partner_company_id").notNull().references(() => partnerCompanies.id, { onDelete: "cascade" }),
    wellId:              uuid("well_id").notNull().references(() => wells.id, { onDelete: "cascade" }),
    visibilityOverrides: jsonb("visibility_overrides").notNull().default("{}"),
    createdAt:           timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt:           timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("pwa_tenant_id_idx").on(t.tenantId),
    index("pwa_partner_company_id_idx").on(t.partnerCompanyId),
    unique("pwa_company_well_unique").on(t.partnerCompanyId, t.wellId),
  ]
);

export type PartnerWellAccess    = typeof partnerWellAccess.$inferSelect;
export type NewPartnerWellAccess = typeof partnerWellAccess.$inferInsert;
