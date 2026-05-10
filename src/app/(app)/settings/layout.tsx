import { SettingsTabs } from "@/components/layout/settings-tabs";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your organization settings, users, and preferences.
        </p>
      </div>

      {/* Tab nav */}
      <SettingsTabs />

      {children}
    </div>
  );
}
