"use client";

import { useState, useEffect } from "react";

type JobModule =
  | "location_construction"
  | "drilling"
  | "completions"
  | "production_facilities_install"
  | "workovers"
  | "re_completions"
  | "logging_testing_science"
  | "artificial_lift_installation";

type JobStatus = "active" | "completed" | "suspended";

const MODULE_LABELS: Record<JobModule, string> = {
  location_construction:        "Location Construction",
  drilling:                     "Drilling",
  completions:                  "Completions",
  production_facilities_install:"Production Facilities Install",
  workovers:                    "Workovers",
  re_completions:               "Re-Completions",
  logging_testing_science:      "Logging / Testing / Science",
  artificial_lift_installation: "Artificial Lift Installation",
};

const STATUS_LABELS: Record<JobStatus, string> = {
  active:    "Active",
  completed: "Completed",
  suspended: "Suspended",
};

interface Job {
  id: string;
  wellId: string;
  module: JobModule;
  jobNumber: number;
  name: string;
  status: JobStatus;
  startDate: string;
  endDate: string | null;
  distributionTime: string;
}

interface JobFormData {
  name: string;
  module: JobModule;
  status: JobStatus;
  startDate: string;
  endDate: string;
  distributionTime: string;
}

interface JobFormDialogProps {
  open: boolean;
  wellId: string;
  job?: Job | null;
  onClose: () => void;
  onSuccess: (job: Job) => void;
}

const EMPTY: JobFormData = {
  name: "",
  module: "drilling",
  status: "active",
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
  distributionTime: "06:00",
};

export function JobFormDialog({ open, wellId, job, onClose, onSuccess }: JobFormDialogProps) {
  const isEdit = !!job;
  const [form, setForm] = useState<JobFormData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(
        job
          ? {
              name: job.name,
              module: job.module,
              status: job.status,
              startDate: job.startDate,
              endDate: job.endDate ?? "",
              distributionTime: job.distributionTime,
            }
          : EMPTY
      );
      setError(null);
    }
  }, [open, job]);

  function set(field: keyof JobFormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      wellId,
      name: form.name,
      module: form.module,
      status: form.status,
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      distributionTime: form.distributionTime,
    };

    try {
      const res = await fetch(
        isEdit ? `/api/v1/jobs/${job!.id}` : "/api/v1/jobs",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to save job");
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
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? `Edit job #${job!.jobNumber}` : "Add job"}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {isEdit ? "Update job details." : "Create a new job on this well."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Module */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job type <span className="text-red-500">*</span>
            </label>
            <select
              value={form.module}
              onChange={(e) => set("module", e.target.value as JobModule)}
              disabled={isEdit}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            >
              {(Object.keys(MODULE_LABELS) as JobModule[]).map((m) => (
                <option key={m} value={m}>{MODULE_LABELS[m]}</option>
              ))}
            </select>
            {isEdit && (
              <p className="mt-1 text-xs text-gray-400">Job type cannot be changed after creation.</p>
            )}
          </div>

          {/* Job name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder={`Reagan 1H ${MODULE_LABELS[form.module]}`}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value as JobStatus)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              {(Object.keys(STATUS_LABELS) as JobStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>

          {/* Start date + End date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End date
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => set("endDate", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
          </div>

          {/* Distribution time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report distribution time
            </label>
            <input
              type="time"
              value={form.distributionTime}
              onChange={(e) => set("distributionTime", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-400">
              Daily PDF report will be sent to distribution list at this time (well&apos;s local time).
            </p>
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
              {loading ? "Saving…" : isEdit ? "Save changes" : "Create job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
