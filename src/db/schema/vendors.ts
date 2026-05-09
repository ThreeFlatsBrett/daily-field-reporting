import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const vendors = pgTable(
  "vendors",
  {
    id:           uuid("id").primaryKey().defaultRandom(),
    tenantId:     uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    name:         text("name").notNull(),
    category:     text("category"),
    contactName:  text("contact_name"),
    contactPhone: text("contact_phone"),
    contactEmail: text("contact_email"),
    createdAt:    timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt:    timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("vendors_tenant_id_idx").on(t.tenantId),
  ]
);

export type Vendor    = typeof vendors.$inferSelect;
export type NewVendor = typeof vendors.$inferInsert;
