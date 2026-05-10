"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";

type ReportStatus = "draft" | "submitted" | "approved" | "rejected";

interface ReportRow {
  reportId:    string;
  reportDate:  string;
  status:      ReportStatus;
  submittedAt: string | null;
  jobId:       string;
  jobName:     string;
  wellId:      string;
  wellName:    string;
  siteId:      string;
  siteName:    string;
}

interface AllReportsListProps {
  initialRows: ReportRow[];
  isAdmin:     boolean;
}

type FilterStatus = "all" | ReportStatus;

const STATUS_COLORS: Record<ReportStatus, string> = {
  draft:     "bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-200",
  submitted: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  approved:  "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200",
  rejected:  "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
};

export function AllReportsList({ initialRows, isAdmin }: AllReportsListProps) {
  const [rows, setRows] = useState<ReportRow[]>(initialRows);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [approving, setApproving] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    // Re-fetch by navigating (full server reload for fresh data)
    window.location.reload();
  }, []);

  async function handleApprove(reportId: string) {
    setApproving(reportId);
    const res = await fetch(`/api/v1/reports/${reportId}/approve`, { method: "POST" });
    if (res.ok) {
      setRows((r) => r.map((row) => row.reportId === reportId ? { ...row, status: "approved" } : row));
    }
    setApproving(null);
  }

  async function handleReject(reportId: string) {
    if (!rejectNote.trim()) return;
    setRejecting(reportId);
    const res = await fetch(`/api/v1/reports/${reportId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rejectionNote: rejectNote }),
    });
    if (res.ok) {
      setRows((r) => r.map((row) => row.reportId === reportId ? { ...row, status: "rejected" } : row));
    }
    setRejecting(null);
    setActionId(null);
    setRejectNote("");
  }

  const filtered = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  const counts = {
    all:       rows.length,
    draft:     rows.filter((r) => r.status === "draft").length,
    submitted: rows.filter((r) => r.status === "submitted").length,
    approved:  rows.filter((r) => r.status === "approved").length,
    rejected:  rows.filter((r) => r.status === "rejected").length,
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Filter tabs */}
      <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-1 flex-wrap">
        {(["all", "submitted", "draft", "approved", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === f
                ? "bg-gray-900 text-white"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {counts[f] > 0 && (
              <span className={`ml-1.5 ${filter === f ? "text-gray-300" : "text-gray-400"}`}>
                {counts[f]}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-gray-400">
          No reports{filter !== "all" ? ` with status "${filter}"` : ""}.
        </div>
      ) : (
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Well / Job</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((row) => {
              const reportPath = `/sites/${row.siteId}/wells/${row.wellId}/jobs/${row.jobId}/reports/${row.reportId}`;
              const isRejectOpen = actionId === row.reportId;
              return (
                <React.Fragment key={row.reportId}>
                  <tr key={row.reportId} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900 font-mono whitespace-nowrap">
                      {new Date(row.reportDate + "T12:00:00").toLocaleDateString("en-US", {
                        year: "numeric", month: "short", day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-3">
                      <p className="text-sm font-medium text-gray-900">{row.wellName}</p>
                      <p className="text-xs text-gray-400">{row.jobName} · {row.siteName}</p>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[row.status]}`}>
                        {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {row.submittedAt
                        ? new Date(row.submittedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
                        : "—"}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {isAdmin && row.status === "submitted" && (
                          <>
                            <button
                              onClick={() => handleApprove(row.reportId)}
                              disabled={approving === row.reportId}
                              className="text-xs font-medium text-green-600 hover:text-green-800 disabled:opacity-50"
                            >
                              {approving === row.reportId ? "…" : "Approve"}
                            </button>
                            <button
                              onClick={() => { setActionId(row.reportId); setRejectNote(""); }}
                              className="text-xs font-medium text-red-500 hover:text-red-700"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <Link
                          href={reportPath}
                          className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          {row.status === "draft" || row.status === "rejected" ? "Edit →" : "View →"}
                        </Link>
                      </div>
                    </td>
                  </tr>
                  {isRejectOpen && (
                    <tr className="bg-red-50">
                      <td colSpan={5} className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            placeholder="Rejection reason…"
                            value={rejectNote}
                            onChange={(e) => setRejectNote(e.target.value)}
                            className="flex-1 rounded-lg border border-red-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
                            autoFocus
                            onKeyDown={(e) => { if (e.key === "Enter") handleReject(row.reportId); if (e.key === "Escape") setActionId(null); }}
                          />
                          <button
                            onClick={() => handleReject(row.reportId)}
                            disabled={!rejectNote.trim() || rejecting === row.reportId}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {rejecting === row.reportId ? "…" : "Send rejection"}
                          </button>
                          <button
                            onClick={() => setActionId(null)}
                            className="text-sm text-gray-500 hover:text-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
