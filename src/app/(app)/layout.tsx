import { Sidebar } from "@/components/layout/sidebar";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // If no tenants exist at all, the app needs first-time setup
  const existing = await db.select({ id: tenants.id }).from(tenants).limit(1);
  if (existing.length === 0) {
    redirect("/setup");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
