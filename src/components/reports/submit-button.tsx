"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SubmitButtonProps {
  reportId: string;
  jobId: string;
  siteId: string;
  wellId: string;
}

export function SubmitButton({ reportId, jobId, siteId, wellId }: SubmitButtonProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/v1/reports/${reportId}/submit`, { method: "POST" });
    if (res.ok) {
      router.push(`/sites/${siteId}/wells/${wellId}/jobs/${jobId}/reports`);
    } else {
      const json = await res.json();
      setError(json.error ?? "Failed to submit");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60 transition-colors shadow-sm"
      >
        {submitting ? "Submitting…" : "Submit for approval →"}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
