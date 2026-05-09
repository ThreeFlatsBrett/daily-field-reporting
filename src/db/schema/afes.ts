import { pgTable, uuid, text, numeric, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { jobs } from "./jobs";

export const afes = pgTable(
  "afes",
  {
    id:          uuid("id").primaryKey().defaultRandom(),
    tenantId:    uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    jobId:       uuid("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
    afeNumber:   text("afe_number").notNull(),
    totalBudget: numeric("total_budget", { precision: 15, scale: 2 }),
    createdAt:   timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt:   timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("afes_tenant_id_idx").on(t.tenantId),
    index("afes_job_id_idx").on(t.jobId),
  ]
);

export type Afe    = typeof afes.$inferSelect;
export type NewAfe = typeof afes.$inferInsert;
