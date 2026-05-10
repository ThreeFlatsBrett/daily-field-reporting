"use client";

import { useState, useCallback } from "react";

interface Afe { id: string; afeNumber: string; }
interface LineItem {
  id: string; category: string; description: string;
  afeId: string | null; afeAmount: string | null; sortOrder: number;
}

interface CoaSectionProps {
  jobId: string;
  initialLineItems: LineItem[];
  afes: Afe[];
}

function fmt(v: string | null) {
  if (!v) return "—";
  return "$" + parseFloat(v).toLocaleString("en-US", { minimumFractionDigits: 2 });
}

const CATEGORIES = [
  "Drilling", "Bits", "Mud / Chemicals", "Cementing", "Casing / Tubulars",
  "Directional Drilling", "Mud Logging", "Wireline / Perforating",
  "Completions", "Stimulation", "Coiled Tubing", "Wellhead / Equipment",
  "Location Construction", "Trucking", "Water Hauling", "Rentals",
  "Safety / H2S", "Fuel / Power", "Catering", "Engineering / Consulting",
  "Other", "Overhead",
];

export function CoaSection({ jobId, initialLineItems, afes }: CoaSectionProps) {
  const [items, setItems] = useState<LineItem[]>(initialLineItems);
  const [adding, setAdding] = useState(false);
  const [category, setCategory] = useState("Drilling");
  const [description, setDescription] = useState("");
  const [afeId, setAfeId] = useState("");
  const [afeAmount, setAfeAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const res = await fetch(`/api/v1/jobs/${jobId}/coa`);
    const json = await res.json();
    if (json.data?.lineItems) setItems(json.data.lineItems);
  }, [jobId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/v1/jobs/${jobId}/coa/line-items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category, description,
        afeId: afeId || undefined,
        afeAmount: afeAmount || undefined,
        sortOrder: items.length,
      }),
    });
    setCategory("Drilling"); setDescription(""); setAfeId(""); setAfeAmount(""); setAdding(false);
    await reload();
    setSaving(false);
  }

  async function handleDelete(itemId: string) {
    setDeletingId(itemId);
    await fetch(`/api/v1/jobs/${jobId}/coa/line-items/${itemId}`, { method: "DELETE" });
    await reload();
    setDeletingId(null);
  }

  const total = items.reduce((sum, i) => sum + (i.afeAmount ? parseFloat(i.afeAmount) : 0), 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Chart of Accounts</h2>
        <button onClick={() => setAdding(true)}
          className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
          + Add line item
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <form onSubmit={handleAdd} className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <div className="grid grid-cols-12 gap-3 items-end">
            <div className="col-span-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-span-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <input type="text" required placeholder="PDC bit, 6.5&quot;" value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">AFE</label>
              <select value={afeId} onChange={(e) => setAfeId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent">
                <option value="">None</option>
                {afes.map((a) => <option key={a.id} value={a.id}>{a.afeNumber}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Budget ($)</label>
              <input type="number" step="0.01" min="0" placeholder="0.00" value={afeAmount}
                onChange={(e) => setAfeAmount(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
            </div>
            <div className="col-span-1 flex gap-1.5">
              <button type="submit" disabled={saving}
                className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60">
                {saving ? "…" : "Add"}
              </button>
              <button type="button" onClick={() => setAdding(false)}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-50">✕</button>
            </div>
          </div>
        </form>
      )}

      {items.length === 0 && !adding && (
        <div className="px-6 py-8 text-center text-sm text-gray-400">
          No line items yet.{" "}
          <button onClick={() => setAdding(true)} className="text-gray-600 hover:text-gray-900 underline">Add one</button>.
        </div>
      )}

      {items.length > 0 && (
        <>
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AFE</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-3 text-sm text-gray-600">{item.category}</td>
                  <td className="px-6 py-3 text-sm text-gray-900">{item.description}</td>
                  <td className="px-6 py-3 text-sm text-gray-500 font-mono text-xs">
                    {item.afeId ? (afes.find((a) => a.id === item.afeId)?.afeNumber ?? "—") : "—"}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-700 text-right">{fmt(item.afeAmount)}</td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => handleDelete(item.id)} disabled={deletingId === item.id}
                      className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50">
                      {deletingId === item.id ? "…" : "✕"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {total > 0 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total AFE Budget</span>
              <span className="text-sm font-semibold text-gray-900">
                ${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
