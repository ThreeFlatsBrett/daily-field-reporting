"use client";

import { useState, useCallback } from "react";

interface Afe {
  id: string;
  afeNumber: string;
  totalBudget: string | null;
}

interface AfeSectionProps {
  jobId: string;
  initialAfes: Afe[];
}

function fmt(v: string | null) {
  if (!v) return "—";
  return "$" + parseFloat(v).toLocaleString("en-US", { minimumFractionDigits: 2 });
}

export function AfeSection({ jobId, initialAfes }: AfeSectionProps) {
  const [afes, setAfes] = useState<Afe[]>(initialAfes);
  const [adding, setAdding] = useState(false);
  const [afeNumber, setAfeNumber] = useState("");
  const [totalBudget, setTotalBudget] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const res = await fetch(`/api/v1/jobs/${jobId}/afe`);
    const json = await res.json();
    if (json.data) setAfes(json.data);
  }, [jobId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/v1/jobs/${jobId}/afe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ afeNumber, totalBudget: totalBudget || undefined }),
    });
    setAfeNumber(""); setTotalBudget(""); setAdding(false);
    await reload();
    setSaving(false);
  }

  async function handleDelete(afeId: string) {
    if (!confirm("Delete this AFE?")) return;
    setDeletingId(afeId);
    await fetch(`/api/v1/jobs/${jobId}/afe/${afeId}`, { method: "DELETE" });
    await reload();
    setDeletingId(null);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Authorization for Expenditure (AFE)</h2>
        <button onClick={() => setAdding(true)}
          className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
          + Add AFE
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <form onSubmit={handleAdd} className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">AFE number</label>
            <input type="text" required placeholder="AFE-2026-001" value={afeNumber}
              onChange={(e) => setAfeNumber(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">Total budget ($)</label>
            <input type="number" step="0.01" min="0" placeholder="500000.00" value={totalBudget}
              onChange={(e) => setTotalBudget(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
          </div>
          <button type="submit" disabled={saving}
            className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60 whitespace-nowrap">
            {saving ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={() => setAdding(false)}
            className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
        </form>
      )}

      {afes.length === 0 && !adding && (
        <div className="px-6 py-8 text-center text-sm text-gray-400">
          No AFEs added yet.{" "}
          <button onClick={() => setAdding(true)} className="text-gray-600 hover:text-gray-900 underline">Add one</button>.
        </div>
      )}

      {afes.length > 0 && (
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AFE Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Budget</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {afes.map((afe) => (
              <tr key={afe.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-3 text-sm font-mono text-gray-900">{afe.afeNumber}</td>
                <td className="px-6 py-3 text-sm text-gray-700">{fmt(afe.totalBudget)}</td>
                <td className="px-6 py-3 text-right">
                  <button onClick={() => handleDelete(afe.id)} disabled={deletingId === afe.id}
                    className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50">
                    {deletingId === afe.id ? "…" : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
