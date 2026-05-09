import { pgTable, uuid, text, date, integer, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { sites } from "./sites";
import { wellStatusEnum } from "./enums";

export const wells = pgTable(
  "wells",
  {
    id:        uuid("id").primaryKey().defaultRandom(),
    tenantId:  uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    siteId:    uuid("site_id").notNull().references(() => sites.id),
    name:      text("name").notNull(),
    apiNumber: text("api_number"),
    spudDate:  date("spud_date"),
    tdDepth:   integer("td_depth"),
    status:    wellStatusEnum("status").notNull().default("planned"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("wells_tenant_id_idx").on(t.tenantId),
    index("wells_site_id_idx").on(t.siteId),
  ]
);

export type Well    = typeof wells.$inferSelect;
export type NewWell = typeof wells.$inferInsert;
