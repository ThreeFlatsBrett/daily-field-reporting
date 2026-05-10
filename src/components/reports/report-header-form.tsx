"use client";

import { useState } from "react";

interface HeaderValues {
  dailySummary:  string;
  spudDate:      string;
  measuredDepth: string;
  tvd:           string;
  daysOnJob:     string;
}

interface ReportHeaderFormProps {
  reportId:   string;
  isEditable: boolean;
  initial:    HeaderValues;
}

export function ReportHeaderForm({ reportId, isEditable, initial }: ReportHeaderFormProps) {
  const [values, setValues] = useState<HeaderValues>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function set(key: keyof HeaderValues, val: string) {
    setValues((v) => ({ ...v, [key]: val }));
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/v1/reports/${reportId}/header`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dailySummary:  values.dailySummary  || undefined,
        spudDate:      values.spudDate      || undefined,
        measuredDepth: values.measuredDepth || undefined,
        tvd:           values.tvd           || undefined,
        daysOnJob:     values.daysOnJob     || undefined,
      }),
    });
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Daily Header</h2>
          <p className="text-xs text-gray-400 mt-0.5">Summary and depth snapshot for this report day.</p>
        </div>
        {saved && <span className="text-xs text-green-600 font-medium">Saved ✓</span>}
      </div>

      <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Daily Summary</label>
          <textarea
            rows={4}
            placeholder="Describe the day's operations…"
            value={values.dailySummary}
            onChange={(e) => set("dailySummary", e.target.value)}
            disabled={!isEditable}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-50 disabled:text-gray-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Spud Date</label>
            <input
              type="date"
              value={values.spudDate}
              onChange={(e) => set("spudDate", e.target.value)}
              disabled={!isEditable}
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Measured Depth (ft)</label>
            <input
              type="number" step="0.01" min="0"
              placeholder="12500"
              value={values.measuredDepth}
              onChange={(e) => set("measuredDepth", e.target.value)}
              disabled={!isEditable}
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">TVD (ft)</label>
            <input
              type="number" step="0.01" min="0"
              placeholder="10200"
              value={values.tvd}
              onChange={(e) => set("tvd", e.target.value)}
              disabled={!isEditable}
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Days on Job</label>
            <input
              type="number" step="0.5" min="0"
              placeholder="14.5"
              value={values.daysOnJob}
              onChange={(e) => set("daysOnJob", e.target.value)}
              disabled={!isEditable}
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
        </div>

        {isEditable && (
          <div className="pt-1">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60 transition-colors"
            >
              {saving ? "Saving…" : "Save header"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
