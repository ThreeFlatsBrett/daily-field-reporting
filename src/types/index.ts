export * from "./modules";
export * from "./api";

export type UserRole = "admin" | "editor" | "operated_viewer" | "partner_user";

export interface AuthContext {
  tenantId: string;
  userId: string;
  clerkUserId: string;
  role: UserRole;
  allowedWellIds: string[];
}
