import { pgTable, uuid, text, numeric, integer, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { jobs } from "./jobs";
import { afes } from "./afes";

export const chartsOfAccounts = pgTable(
  "charts_of_accounts",
  {
    id:        uuid("id").primaryKey().defaultRandom(),
    tenantId:  uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    jobId:     uuid("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
    name:      text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("coa_tenant_id_idx").on(t.tenantId),
    index("coa_job_id_idx").on(t.jobId),
  ]
);

export const coaLineItems = pgTable(
  "coa_line_items",
  {
    id:          uuid("id").primaryKey().defaultRandom(),
    coaId:       uuid("coa_id").notNull().references(() => chartsOfAccounts.id, { onDelete: "cascade" }),
    afeId:       uuid("afe_id").references(() => afes.id),
    category:    text("category").notNull(),
    description: text("description").notNull(),
    afeAmount:   numeric("afe_amount", { precision: 15, scale: 2 }),
    sortOrder:   integer("sort_order").notNull().default(0),
    createdAt:   timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("coa_line_items_coa_id_idx").on(t.coaId),
  ]
);

export type ChartOfAccounts    = typeof chartsOfAccounts.$inferSelect;
export type NewChartOfAccounts = typeof chartsOfAccounts.$inferInsert;
export type CoaLineItem        = typeof coaLineItems.$inferSelect;
export type NewCoaLineItem     = typeof coaLineItems.$inferInsert;
