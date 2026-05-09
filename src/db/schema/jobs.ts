import { pgTable, uuid, text, date, integer, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { wells } from "./wells";
import { jobModuleEnum, jobStatusEnum } from "./enums";

export const jobs = pgTable(
  "jobs",
  {
    id:               uuid("id").primaryKey().defaultRandom(),
    tenantId:         uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    wellId:           uuid("well_id").notNull().references(() => wells.id),
    module:           jobModuleEnum("module").notNull(),
    jobNumber:        integer("job_number").notNull(),
    name:             text("name").notNull(),
    status:           jobStatusEnum("status").notNull().default("active"),
    startDate:        date("start_date").notNull(),
    endDate:          date("end_date"),
    distributionTime: text("distribution_time").notNull().default("06:00"),
    createdAt:        timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt:        timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("jobs_tenant_id_idx").on(t.tenantId),
    index("jobs_well_id_idx").on(t.wellId),
    index("jobs_status_idx").on(t.status),
  ]
);

export type Job    = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
