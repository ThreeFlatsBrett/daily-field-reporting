"use client";

import { useState } from "react";

interface TimeLogEntry {
  activity:  string;
  startTime: string;
  endTime:   string;
  hours:     number;
  fromDepth?: number;
  toDepth?:   number;
  vendor?:    string;
  notes?:     string;
}

interface TimeLogFormProps {
  reportId:    string;
  isEditable:  boolean;
  initialData: TimeLogEntry[];
}

function hoursFromTimes(start: string, end: string): number {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60; // handle overnight
  return Math.max(0, parseFloat((diff / 60).toFixed(2)));
}

// Generate every :00 and :30 slot across 24 hours
const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:00`);
  TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:30`);
}

const BLANK: TimeLogEntry = { activity: "", startTime: "", endTime: "", hours: 0 };

export function TimeLogForm({ reportId, isEditable, initialData }: TimeLogFormProps) {
  const [rows, setRows] = useState<TimeLogEntry[]>(initialData.length ? initialData : []);
  const [newRow, setNewRow] = useState<TimeLogEntry>({ ...BLANK });
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function setNew(key: keyof TimeLogEntry, val: string | number) {
    setNewRow((r) => {
      const updated = { ...r, [key]: val };
      if (key === "startTime" || key === "endTime") {
        updated.hours = hoursFromTimes(
          key === "startTime" ? String(val) : r.startTime,
          key === "endTime"   ? String(val) : r.endTime,
        );
      }
      return updated;
    });
  }

  function addRow() {
    if (!newRow.activity.trim()) return;
    setRows((r) => [...r, { ...newRow }]);
    setNewRow({ ...BLANK });
    setAdding(false);
    setSaved(false);
  }

  function removeRow(idx: number) {
    setRows((r) => r.filter((_, i) => i !== idx));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/v1/reports/${reportId}/module`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: { timeLog: rows } }),
    });
    setSaving(false);
    setSaved(true);
  }

  const totalHours = rows.reduce((s, r) => s + (r.hours || 0), 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Time Log</h2>
          <p className="text-xs text-gray-400 mt-0.5">Activity breakdown for the 24-hour period.</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-xs text-green-600 font-medium">Saved ✓</span>}
          {isEditable && (
            <button
              onClick={() => setAdding(true)}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              + Add activity
            </button>
          )}
        </div>
      </div>

      {/* Add row form */}
      {adding && (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 space-y-3">
          <div className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">Activity</label>
              <input type="text" required placeholder="Drilling surface hole…"
                value={newRow.activity} onChange={(e) => setNew("activity", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Start</label>
              <select
                value={newRow.startTime} onChange={(e) => setNew("startTime", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900">
                <option value="">—</option>
                {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">End</label>
              <select
                value={newRow.endTime} onChange={(e) => setNew("endTime", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900">
                <option value="">—</option>
                {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-span-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Hrs</label>
              <input type="number" step="0.25" min="0"
                value={newRow.hours} onChange={(e) => setNew("hours", parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Vendor (opt)</label>
              <input type="text" placeholder="HAL"
                value={newRow.vendor ?? ""} onChange={(e) => setNew("vendor", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div className="col-span-1 flex gap-1">
              <button onClick={addRow} type="button"
                className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800">
                Add
              </button>
              <button onClick={() => setAdding(false)} type="button"
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
                ✕
              </button>
            </div>
          </div>
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">From Depth (ft)</label>
              <input type="number" step="1" min="0" placeholder="0"
                value={newRow.fromDepth ?? ""} onChange={(e) => setNew("fromDepth", parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div className="col-span-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">To Depth (ft)</label>
              <input type="number" step="1" min="0" placeholder="500"
                value={newRow.toDepth ?? ""} onChange={(e) => setNew("toDepth", parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div className="col-span-6">
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes (opt)</label>
              <input type="text" placeholder="Any additional notes…"
                value={newRow.notes ?? ""} onChange={(e) => setNew("notes", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
          </div>
        </div>
      )}

      {rows.length === 0 && !adding ? (
        <div className="px-6 py-8 text-center text-sm text-gray-400">
          No activities logged yet.{" "}
          {isEditable && (
            <button onClick={() => setAdding(true)} className="text-gray-600 hover:text-gray-900 underline">
              Add one
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hrs</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Depth (ft)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  {isEditable && <th className="px-4 py-3"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 text-sm text-gray-900">{row.activity}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">{row.startTime || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">{row.endTime || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right font-mono">{row.hours.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono text-xs">
                      {row.fromDepth != null && row.toDepth != null ? `${row.fromDepth}–${row.toDepth}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{row.vendor || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{row.notes || "—"}</td>
                    {isEditable && (
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => removeRow(i)} className="text-xs text-red-400 hover:text-red-600">✕</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {rows.length > 0 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total hours
              </span>
              <span className="text-sm font-semibold text-gray-900 font-mono">{totalHours.toFixed(2)}</span>
            </div>
          )}
        </>
      )}

      {isEditable && rows.length > 0 && (
        <div className="px-6 py-3 border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60 transition-colors"
          >
            {saving ? "Saving…" : "Save time log"}
          </button>
        </div>
      )}
    </div>
  );
}
