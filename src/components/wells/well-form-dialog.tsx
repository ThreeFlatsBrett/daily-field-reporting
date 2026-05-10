"use client";

import { useState, useEffect } from "react";

type WellStatus = "planned" | "active" | "inactive" | "abandoned";

const STATUS_LABELS: Record<WellStatus, string> = {
  planned: "Planned",
  active: "Active",
  inactive: "Inactive",
  abandoned: "Abandoned",
};

interface WellFormData {
  name: string;
  apiNumber: string;
  status: WellStatus;
  spudDate: string;
  tdDepth: string;
}

interface Well {
  id: string;
  siteId: string;
  name: string;
  apiNumber: string | null;
  status: WellStatus;
  spudDate: string | null;
  tdDepth: number | null;
}

interface WellFormDialogProps {
  open: boolean;
  siteId: string;
  well?: Well | null;
  onClose: () => void;
  onSuccess: (well: Well) => void;
}

const EMPTY: WellFormData = {
  name: "", apiNumber: "", status: "planned", spudDate: "", tdDepth: "",
};

export function WellFormDialog({ open, siteId, well, onClose, onSuccess }: WellFormDialogProps) {
  const isEdit = !!well;
  const [form, setForm] = useState<WellFormData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(
        well
          ? {
              name: well.name,
              apiNumber: well.apiNumber ?? "",
              status: well.status,
              spudDate: well.spudDate ?? "",
              tdDepth: well.tdDepth?.toString() ?? "",
            }
          : EMPTY
      );
      setError(null);
    }
  }, [open, well]);

  function set(field: keyof WellFormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      name: form.name,
      siteId,
      apiNumber: form.apiNumber || undefined,
      status: form.status,
      spudDate: form.spudDate || undefined,
      tdDepth: form.tdDepth ? parseInt(form.tdDepth, 10) : undefined,
    };

    try {
      const res = await fetch(
        isEdit ? `/api/v1/wells/${well!.id}` : "/api/v1/wells",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to save well");
        return;
      }

      onSuccess(json.data);
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? "Edit well" : "Add well"}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {isEdit ? "Update well details." : "Add a new well to this site."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Well name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Well name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="State 1H"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          {/* API number + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API number
              </label>
              <input
                type="text"
                placeholder="42-123-45678-00-00"
                value={form.apiNumber}
                onChange={(e) => set("apiNumber", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-400">API-14 format</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value as WellStatus)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                {(Object.keys(STATUS_LABELS) as WellStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Spud date + TD depth */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Spud date
              </label>
              <input
                type="date"
                value={form.spudDate}
                onChange={(e) => set("spudDate", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                TD depth (ft MD)
              </label>
              <input
                type="number"
                min="0"
                placeholder="15000"
                value={form.tdDepth}
                onChange={(e) => set("tdDepth", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Saving…" : isEdit ? "Save changes" : "Add well"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
