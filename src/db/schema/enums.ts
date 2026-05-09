import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "editor",
  "operated_viewer",
  "partner_user",
]);

export const jobModuleEnum = pgEnum("job_module", [
  "location_construction",
  "drilling",
  "completions",
  "production_facilities_install",
  "workovers",
  "re_completions",
  "logging_testing_science",
  "artificial_lift_installation",
]);

export const jobStatusEnum = pgEnum("job_status", [
  "active",
  "completed",
  "suspended",
]);

export const wellStatusEnum = pgEnum("well_status", [
  "planned",
  "active",
  "inactive",
  "abandoned",
]);

export const reportStatusEnum = pgEnum("report_status", [
  "draft",
  "submitted",
  "approved",
  "rejected",
]);

export const distributionTypeEnum = pgEnum("distribution_type", [
  "internal",
  "partner_company",
  "external_email",
]);
