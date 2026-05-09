import { AuthContext, UserRole } from "@/types";
import { ForbiddenError } from "@/lib/api/errors";

export function requireRole(ctx: AuthContext, allowed: UserRole[]) {
  if (!allowed.includes(ctx.role)) {
    throw new ForbiddenError();
  }
}

export function canAccessWell(ctx: AuthContext, wellId: string): boolean {
  if (ctx.role === "partner_user") {
    return ctx.allowedWellIds.includes(wellId);
  }
  return true;
}

export function assertWellAccess(ctx: AuthContext, wellId: string) {
  if (!canAccessWell(ctx, wellId)) {
    throw new ForbiddenError();
  }
}

export function canEdit(ctx: AuthContext): boolean {
  return ctx.role === "admin" || ctx.role === "editor";
}

export function isAdmin(ctx: AuthContext): boolean {
  return ctx.role === "admin";
}
