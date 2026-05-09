import { pgTable, uuid, text, time, timestamp } from "drizzle-orm/pg-core";

export const tenants = pgTable("tenants", {
  id:           uuid("id").primaryKey().defaultRandom(),
  name:         text("name").notNull(),
  slug:         text("slug").notNull().unique(),
  logoUrl:      text("logo_url"),
  rolloverTime: time("rollover_time").notNull().default("00:00"),
  timezone:     text("timezone").notNull().default("America/Chicago"),
  createdAt:    timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:    timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Tenant    = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
