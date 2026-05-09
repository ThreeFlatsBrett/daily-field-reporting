import { pgTable, uuid, text, doublePrecision, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const sites = pgTable(
  "sites",
  {
    id:        uuid("id").primaryKey().defaultRandom(),
    tenantId:  uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    name:      text("name").notNull(),
    latitude:  doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    address:   text("address"),
    county:    text("county"),
    state:     text("state"),
    country:   text("country").notNull().default("US"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("sites_tenant_id_idx").on(t.tenantId),
  ]
);

export type Site    = typeof sites.$inferSelect;
export type NewSite = typeof sites.$inferInsert;
