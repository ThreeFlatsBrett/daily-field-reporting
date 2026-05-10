"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ApproveRejectButtonsProps {
  reportId: string;
  backUrl:  string;
}

export function ApproveRejectButtons({ reportId, backUrl }: ApproveRejectButtonsProps) {
  const router = useRouter();
  const [approving, setApproving] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    setApproving(true);
    setError(null);
    const res = await fetch(`/api/v1/reports/${reportId}/approve`, { method: "POST" });
    if (res.ok) {
      router.push(backUrl);
      router.refresh();
    } else {
      const j = await res.json();
      setError(j.error ?? "Failed to approve");
      setApproving(false);
    }
  }

  async function handleReject() {
    if (!rejectNote.trim()) return;
    setRejecting(true);
    setError(null);
    const res = await fetch(`/api/v1/reports/${reportId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rejectionNote: rejectNote }),
    });
    if (res.ok) {
      router.push(backUrl);
      router.refresh();
    } else {
      const j = await res.json();
      setError(j.error ?? "Failed to reject");
      setRejecting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowReject(!showReject)}
          className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          Return with notes
        </button>
        <button
          onClick={handleApprove}
          disabled={approving}
          className="rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60 transition-colors shadow-sm"
        >
          {approving ? "Approving…" : "Approve ✓"}
        </button>
      </div>

      {showReject && (
        <div className="flex items-center gap-2 w-full max-w-md">
          <input
            type="text"
            placeholder="Rejection reason…"
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleReject(); if (e.key === "Escape") setShowReject(false); }}
            autoFocus
            className="flex-1 rounded-lg border border-red-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          <button
            onClick={handleReject}
            disabled={!rejectNote.trim() || rejecting}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {rejecting ? "…" : "Send"}
          </button>
          <button onClick={() => setShowReject(false)} className="text-sm text-gray-400 hover:text-gray-600">✕</button>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
