import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { jobs } from "./jobs";
import { distributionTypeEnum } from "./enums";

export const distributionLists = pgTable(
  "distribution_lists",
  {
    id:          uuid("id").primaryKey().defaultRandom(),
    jobId:       uuid("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
    type:        distributionTypeEnum("type").notNull(),
    referenceId: uuid("reference_id"),
    email:       text("email"),
    displayName: text("display_name"),
    createdAt:   timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("distribution_lists_job_id_idx").on(t.jobId),
  ]
);

export type DistributionList    = typeof distributionLists.$inferSelect;
export type NewDistributionList = typeof distributionLists.$inferInsert;
