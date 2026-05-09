import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { users } from "./users";

export const partnerCompanies = pgTable(
  "partner_companies",
  {
    id:        uuid("id").primaryKey().defaultRandom(),
    tenantId:  uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    name:      text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("partner_companies_tenant_id_idx").on(t.tenantId),
  ]
);

export const partnerUsers = pgTable(
  "partner_users",
  {
    id:               uuid("id").primaryKey().defaultRandom(),
    tenantId:         uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    partnerCompanyId: uuid("partner_company_id").notNull().references(() => partnerCompanies.id, { onDelete: "cascade" }),
    userId:           uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt:        timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("partner_users_tenant_id_idx").on(t.tenantId),
    index("partner_users_company_id_idx").on(t.partnerCompanyId),
  ]
);

export type PartnerCompany    = typeof partnerCompanies.$inferSelect;
export type NewPartnerCompany = typeof partnerCompanies.$inferInsert;
export type PartnerUser       = typeof partnerUsers.$inferSelect;
export type NewPartnerUser    = typeof partnerUsers.$inferInsert;
