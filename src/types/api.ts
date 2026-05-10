import { z } from "zod";

// ─── User Management ────────────────────────────────────────────────────────

export const InviteUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(["admin", "editor", "operated_viewer", "partner_user"]),
});

export const UpdateUserRoleSchema = z.object({
  role: z.enum(["admin", "editor", "operated_viewer", "partner_user"]),
});

export const BootstrapSchema = z.object({
  tenantName: z.string().min(1),
  adminName: z.string().min(1),
});

export type InviteUserInput = z.infer<typeof InviteUserSchema>;
export type UpdateUserRoleInput = z.infer<typeof UpdateUserRoleSchema>;
export type BootstrapInput = z.infer<typeof BootstrapSchema>;

export const CreateSiteSchema = z.object({
  name: z.string().min(1),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  address: z.string().optional(),
  county: z.string().optional(),
  state: z.string().length(2).optional(),
});

export const CreateWellSchema = z.object({
  siteId: z.string().uuid(),
  name: z.string().min(1),
  apiNumber: z.string().optional(),
  spudDate: z.string().optional(),
  tdDepth: z.number().int().optional(),
  status: z.enum(["planned", "active", "inactive", "abandoned"]).optional(),
});

export const CreateJobSchema = z.object({
  wellId: z.string().uuid(),
  module: z.enum([
    "location_construction",
    "drilling",
    "completions",
    "production_facilities_install",
    "workovers",
    "re_completions",
    "logging_testing_science",
    "artificial_lift_installation",
  ]),
  name: z.string().min(1),
  startDate: z.string(),
  distributionTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

export const CreateReportSchema = z.object({
  jobId: z.string().uuid(),
  reportDate: z.string(),
});

export const RejectReportSchema = z.object({
  rejectionNote: z.string().min(1),
});

export const CreateVendorSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional(),
});

export const CreatePartnerCompanySchema = z.object({
  name: z.string().min(1),
});

export const CreateAfeSchema = z.object({
  jobId: z.string().uuid(),
  afeNumber: z.string().min(1),
  totalBudget: z.string().optional(),
});

export const CreateCoaSchema = z.object({
  jobId: z.string().uuid(),
  name: z.string().min(1),
});

export const CreateCoaLineItemSchema = z.object({
  coaId: z.string().uuid(),
  afeId: z.string().uuid().optional(),
  category: z.string().min(1),
  description: z.string().min(1),
  afeAmount: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

// ─── Reports ─────────────────────────────────────────────────────────────────

export const CreateJobReportSchema = z.object({
  reportDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
});

export const UpsertReportHeaderSchema = z.object({
  dailySummary:  z.string().optional(),
  spudDate:      z.string().optional(),
  measuredDepth: z.string().optional(),
  tvd:           z.string().optional(),
  daysOnJob:     z.string().optional(),
});

export const UpsertCostEntriesSchema = z.object({
  entries: z.array(z.object({
    coaLineItemId: z.string().uuid(),
    dailyCost:     z.string(),
  })),
});

export const UpsertModuleDataSchema = z.object({
  data: z.record(z.unknown()),
});

export type CreateJobReportInput    = z.infer<typeof CreateJobReportSchema>;
export type UpsertReportHeaderInput = z.infer<typeof UpsertReportHeaderSchema>;
export type UpsertCostEntriesInput  = z.infer<typeof UpsertCostEntriesSchema>;
export type UpsertModuleDataInput   = z.infer<typeof UpsertModuleDataSchema>;

export type CreateSiteInput         = z.infer<typeof CreateSiteSchema>;
export type CreateWellInput         = z.infer<typeof CreateWellSchema>;
export type CreateJobInput          = z.infer<typeof CreateJobSchema>;
export type CreateReportInput       = z.infer<typeof CreateReportSchema>;
export type RejectReportInput       = z.infer<typeof RejectReportSchema>;
export type CreateVendorInput       = z.infer<typeof CreateVendorSchema>;
export type CreatePartnerCompanyInput = z.infer<typeof CreatePartnerCompanySchema>;
export type CreateAfeInput          = z.infer<typeof CreateAfeSchema>;
export type CreateCoaInput          = z.infer<typeof CreateCoaSchema>;
export type CreateCoaLineItemInput  = z.infer<typeof CreateCoaLineItemSchema>;
