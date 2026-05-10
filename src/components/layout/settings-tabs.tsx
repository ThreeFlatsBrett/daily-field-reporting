"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const settingsTabs = [
  { href: "/settings/users", label: "Users" },
  { href: "/settings", label: "General", exact: true },
];

export function SettingsTabs() {
  const pathname = usePathname();

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex gap-6">
        {settingsTabs.map((tab) => {
          const active = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                active
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
