import { pgTable, uuid, text, timestamp, index, unique } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { userRoleEnum } from "./enums";

export const users = pgTable(
  "users",
  {
    id:          uuid("id").primaryKey().defaultRandom(),
    tenantId:    uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    clerkUserId: text("clerk_user_id").notNull().unique(),
    email:       text("email").notNull(),
    name:        text("name").notNull(),
    role:        userRoleEnum("role").notNull(),
    createdAt:   timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt:   timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("users_tenant_id_idx").on(t.tenantId),
    index("users_clerk_user_id_idx").on(t.clerkUserId),
    unique("users_tenant_email_unique").on(t.tenantId, t.email),
  ]
);

export type User    = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
