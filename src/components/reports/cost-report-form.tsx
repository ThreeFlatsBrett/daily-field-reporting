"use client";

import { useState } from "react";

interface LineItem {
  id:          string;
  category:    string;
  description: string;
  afeAmount:   string | null;
}

interface CostReportFormProps {
  reportId:     string;
  isEditable:   boolean;
  lineItems:    LineItem[];
  initialCosts: Record<string, string>; // coaLineItemId → dailyCost
}

function fmt(v: string | null) {
  if (!v || v === "0") return "—";
  return "$" + parseFloat(v).toLocaleString("en-US", { minimumFractionDigits: 2 });
}

export function CostReportForm({ reportId, isEditable, lineItems, initialCosts }: CostReportFormProps) {
  const [costs, setCosts] = useState<Record<string, string>>(initialCosts);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function setCost(id: string, val: string) {
    setCosts((c) => ({ ...c, [id]: val }));
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const entries = lineItems.map((i) => ({
      coaLineItemId: i.id,
      dailyCost: costs[i.id] || "0",
    }));
    await fetch(`/api/v1/reports/${reportId}/costs`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries }),
    });
    setSaving(false);
    setSaved(true);
  }

  const dailyTotal = lineItems.reduce((s, i) => {
    const v = parseFloat(costs[i.id] || "0");
    return s + (isNaN(v) ? 0 : v);
  }, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Daily Costs</h2>
          <p className="text-xs text-gray-400 mt-0.5">Enter costs incurred today for each line item.</p>
        </div>
        {saved && <span className="text-xs text-green-600 font-medium">Saved ✓</span>}
      </div>

      <form onSubmit={handleSave}>
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">AFE Budget</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-44">Daily Cost ($)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lineItems.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-3 text-sm text-gray-600">{item.category}</td>
                <td className="px-6 py-3 text-sm text-gray-900">{item.description}</td>
                <td className="px-6 py-3 text-sm text-gray-500 text-right">{fmt(item.afeAmount)}</td>
                <td className="px-6 py-3 text-right">
                  {isEditable ? (
                    <input
                      type="number" step="0.01" min="0"
                      placeholder="0.00"
                      value={costs[item.id] ?? ""}
                      onChange={(e) => setCost(item.id, e.target.value)}
                      className="w-36 rounded-lg border border-gray-300 px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  ) : (
                    <span className="text-sm text-gray-700">{fmt(costs[item.id] ?? null)}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Daily Total</span>
          <span className="text-sm font-semibold text-gray-900">
            ${dailyTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {isEditable && (
          <div className="px-6 py-3 border-t border-gray-100">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60 transition-colors"
            >
              {saving ? "Saving…" : "Save costs"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
