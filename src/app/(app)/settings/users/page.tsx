import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthContextOrRedirect } from "@/lib/auth/get-tenant";
import { requireRole } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";
import { UsersTable } from "@/components/users/users-table";

export default async function UsersSettingsPage() {
  const ctx = await getAuthContextOrRedirect();
  try {
    requireRole(ctx, ["admin"]);
  } catch {
    redirect("/dashboard");
  }

  const tenantUsers = await db
    .select()
    .from(users)
    .where(eq(users.tenantId, ctx.tenantId))
    .orderBy(users.createdAt);

  return (
    <div>
      <UsersTable
        initialUsers={tenantUsers.map((u) => ({
          id:        u.id,
          name:      u.name,
          email:     u.email,
          role:      u.role,
          isActive:  u.isActive,
          isPending: u.clerkUserId.startsWith("invited_"),
          createdAt: u.createdAt.toISOString(),
        }))}
        currentUserId={ctx.userId}
      />
    </div>
  );
}
