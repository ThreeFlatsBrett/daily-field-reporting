"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

type ReportStatus = "draft" | "submitted" | "approved" | "rejected";

interface Report {
  id: string;
  reportDate: string;
  status: ReportStatus;
  submittedAt: string | null;
  createdAt: string;
}

interface ReportListProps {
  jobId: string;
  siteId: string;
  wellId: string;
  initialReports: Report[];
}

const STATUS_COLORS: Record<ReportStatus, string> = {
  draft:     "bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-200",
  submitted: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  approved:  "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200",
  rejected:  "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
};

export function ReportList({ jobId, siteId, wellId, initialReports }: ReportListProps) {
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const res = await fetch(`/api/v1/jobs/${jobId}/reports`);
    const json = await res.json();
    if (json.data) setReports(json.data);
  }, [jobId]);

  async function handleCreate() {
    setCreating(true);
    setCreateError(null);
    const today = new Date().toISOString().slice(0, 10);
    const res = await fetch(`/api/v1/jobs/${jobId}/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportDate: today }),
    });
    const json = await res.json();
    if (!res.ok) {
      setCreateError(json.error ?? "Failed to create report");
      setCreating(false);
      return;
    }
    // Navigate to the new report
    window.location.href = `/sites/${siteId}/wells/${wellId}/jobs/${jobId}/reports/${json.data.id}`;
  }

  const basePath = `/sites/${siteId}/wells/${wellId}/jobs/${jobId}/reports`;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">All Reports</h2>
          <p className="text-xs text-gray-400 mt-0.5">One report per day, per job.</p>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60 transition-colors"
        >
          {creating ? "Creating…" : "+ New report"}
        </button>
      </div>

      {createError && (
        <div className="px-6 py-3 bg-red-50 border-b border-red-100 text-sm text-red-600">
          {createError === "daily_reports_job_date_unique"
            ? "A report already exists for today."
            : createError}
        </div>
      )}

      {reports.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-gray-400">
          No reports yet.{" "}
          <button onClick={handleCreate} disabled={creating} className="text-gray-600 hover:text-gray-900 underline">
            Create today&apos;s report
          </button>
        </div>
      ) : (
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reports.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-3 text-sm font-medium text-gray-900 font-mono">
                  {new Date(r.reportDate + "T12:00:00").toLocaleDateString("en-US", {
                    year: "numeric", month: "short", day: "numeric",
                  })}
                </td>
                <td className="px-6 py-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[r.status]}`}>
                    {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-3 text-sm text-gray-500">
                  {r.submittedAt
                    ? new Date(r.submittedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
                    : "—"}
                </td>
                <td className="px-6 py-3 text-right">
                  <Link
                    href={`${basePath}/${r.id}`}
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {r.status === "draft" || r.status === "rejected" ? "Edit →" : "View →"}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
