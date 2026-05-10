"use client";

import { useState, useCallback } from "react";

type DistType = "internal" | "partner_company" | "external_email";

interface DistEntry {
  id: string;
  type: DistType;
  email: string | null;
  displayName: string | null;
  referenceId: string | null;
}

interface InternalUser { id: string; name: string; email: string; clerkUserId: string; }

interface DistributionSectionProps {
  jobId: string;
  initialEntries: DistEntry[];
  internalUsers: InternalUser[];
}

const TYPE_LABELS: Record<DistType, string> = {
  internal: "Internal",
  partner_company: "Partner Company",
  external_email: "External Email",
};

const TYPE_COLORS: Record<DistType, string> = {
  internal:        "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200",
  partner_company: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  external_email:  "bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-200",
};

export function DistributionSection({ jobId, initialEntries, internalUsers }: DistributionSectionProps) {
  const [entries, setEntries] = useState<DistEntry[]>(initialEntries);
  const [adding, setAdding] = useState(false);
  const [addType, setAddType] = useState<"internal" | "external_email">("external_email");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [internalUserId, setInternalUserId] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const res = await fetch(`/api/v1/jobs/${jobId}/distribution`);
    const json = await res.json();
    if (json.data) setEntries(json.data);
  }, [jobId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    let payload: Record<string, string>;
    if (addType === "internal") {
      const user = internalUsers.find((u) => u.id === internalUserId);
      if (!user) { setSaving(false); return; }
      payload = { type: "internal", referenceId: user.id, email: user.email, displayName: user.name };
    } else {
      payload = { type: "external_email", email, displayName: displayName || email };
    }

    await fetch(`/api/v1/jobs/${jobId}/distribution`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setEmail(""); setDisplayName(""); setInternalUserId(""); setAdding(false);
    await reload();
    setSaving(false);
  }

  async function handleDelete(entryId: string) {
    setDeletingId(entryId);
    await fetch(`/api/v1/jobs/${jobId}/distribution/${entryId}`, { method: "DELETE" });
    await reload();
    setDeletingId(null);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Report Distribution</h2>
          <p className="text-xs text-gray-400 mt-0.5">Who receives the daily PDF report.</p>
        </div>
        <button onClick={() => setAdding(true)}
          className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
          + Add recipient
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <form onSubmit={handleAdd} className="px-6 py-4 bg-gray-50 border-b border-gray-100 space-y-3">
          <div className="flex gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="radio" name="addType" value="external_email" checked={addType === "external_email"}
                onChange={() => setAddType("external_email")} />
              External email
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="radio" name="addType" value="internal" checked={addType === "internal"}
                onChange={() => setAddType("internal")} />
              Internal user
            </label>
          </div>

          {addType === "external_email" && (
            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email address</label>
                <input type="email" required placeholder="ops@company.com" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Display name (optional)</label>
                <input type="text" placeholder="Operations Team" value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
            </div>
          )}

          {addType === "internal" && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Select user</label>
              <select required value={internalUserId} onChange={(e) => setInternalUserId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900">
                <option value="">— Select a user —</option>
                {internalUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60">
              {saving ? "Adding…" : "Add recipient"}
            </button>
            <button type="button" onClick={() => setAdding(false)}
              className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      )}

      {entries.length === 0 && !adding && (
        <div className="px-6 py-8 text-center text-sm text-gray-400">
          No recipients yet.{" "}
          <button onClick={() => setAdding(true)} className="text-gray-600 hover:text-gray-900 underline">Add one</button>.
        </div>
      )}

      {entries.length > 0 && (
        <ul className="divide-y divide-gray-100">
          {entries.map((entry) => (
            <li key={entry.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50/50">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[entry.type]}`}>
                  {TYPE_LABELS[entry.type]}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{entry.displayName ?? entry.email}</p>
                  {entry.displayName && entry.email && (
                    <p className="text-xs text-gray-400">{entry.email}</p>
                  )}
                </div>
              </div>
              <button onClick={() => handleDelete(entry.id)} disabled={deletingId === entry.id}
                className="text-sm text-red-400 hover:text-red-600 disabled:opacity-50 transition-colors">
                {deletingId === entry.id ? "…" : "Remove"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
