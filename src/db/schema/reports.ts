import {
  pgTable, uuid, text, date, timestamp, numeric, jsonb, index, unique,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { jobs } from "./jobs";
import { users } from "./users";
import { coaLineItems } from "./coa";
import { reportStatusEnum, jobModuleEnum } from "./enums";

export const dailyReports = pgTable(
  "daily_reports",
  {
    id:            uuid("id").primaryKey().defaultRandom(),
    tenantId:      uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    jobId:         uuid("job_id").notNull().references(() => jobs.id),
    reportDate:    date("report_date").notNull(),
    status:        reportStatusEnum("status").notNull().default("draft"),
    submittedAt:   timestamp("submitted_at", { withTimezone: true }),
    approvedAt:    timestamp("approved_at", { withTimezone: true }),
    approvedBy:    uuid("approved_by").references(() => users.id),
    rejectionNote: text("rejection_note"),
    pdfUrl:        text("pdf_url"),
    distributedAt: timestamp("distributed_at", { withTimezone: true }),
    createdAt:     timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt:     timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("daily_reports_tenant_id_idx").on(t.tenantId),
    index("daily_reports_job_id_idx").on(t.jobId),
    index("daily_reports_status_idx").on(t.status),
    index("daily_reports_report_date_idx").on(t.reportDate),
    unique("daily_reports_job_date_unique").on(t.jobId, t.reportDate),
  ]
);

export const reportHeaders = pgTable(
  "report_headers",
  {
    id:            uuid("id").primaryKey().defaultRandom(),
    reportId:      uuid("report_id").notNull().unique().references(() => dailyReports.id, { onDelete: "cascade" }),
    dailySummary:  text("daily_summary"),
    spudDate:      date("spud_date"),
    measuredDepth: numeric("measured_depth", { precision: 10, scale: 2 }),
    tvd:           numeric("tvd", { precision: 10, scale: 2 }),
    daysOnJob:     numeric("days_on_job", { precision: 6, scale: 1 }),
    createdAt:     timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt:     timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  }
);

export const reportCostEntries = pgTable(
  "report_cost_entries",
  {
    id:             uuid("id").primaryKey().defaultRandom(),
    reportId:       uuid("report_id").notNull().references(() => dailyReports.id, { onDelete: "cascade" }),
    coaLineItemId:  uuid("coa_line_item_id").notNull().references(() => coaLineItems.id),
    dailyCost:      numeric("daily_cost", { precision: 15, scale: 2 }).notNull().default("0"),
    cumulativeCost: numeric("cumulative_cost", { precision: 15, scale: 2 }).notNull().default("0"),
    createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt:      timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("report_cost_entries_report_id_idx").on(t.reportId),
    unique("report_cost_entries_report_coa_unique").on(t.reportId, t.coaLineItemId),
  ]
);

export const reportModuleData = pgTable(
  "report_module_data",
  {
    id:        uuid("id").primaryKey().defaultRandom(),
    reportId:  uuid("report_id").notNull().unique().references(() => dailyReports.id, { onDelete: "cascade" }),
    module:    jobModuleEnum("module").notNull(),
    data:      jsonb("data").notNull().default("{}"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  }
);

export type DailyReport         = typeof dailyReports.$inferSelect;
export type NewDailyReport      = typeof dailyReports.$inferInsert;
export type ReportHeader        = typeof reportHeaders.$inferSelect;
export type NewReportHeader     = typeof reportHeaders.$inferInsert;
export type ReportCostEntry     = typeof reportCostEntries.$inferSelect;
export type NewReportCostEntry  = typeof reportCostEntries.$inferInsert;
export type ReportModuleData    = typeof reportModuleData.$inferSelect;
export type NewReportModuleData = typeof reportModuleData.$inferInsert;
