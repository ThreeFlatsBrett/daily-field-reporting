import { getAuthContextOrRedirect } from "@/lib/auth/get-tenant";

export default async function SettingsPage() {
  const ctx = await getAuthContextOrRedirect();

  // Admins land on Users. Others see a basic placeholder.
  if (ctx.role === "admin") {
    redirect("/settings/users");
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-6 py-10 text-center">
      <p className="text-sm text-gray-500">
        No settings are available for your role.
      </p>
    </div>
  );
}
