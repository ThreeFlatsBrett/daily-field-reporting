"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { JobFormDialog } from "./job-form-dialog";

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
  location_construction:         "Location Construction",
  drilling:                      "Drilling",
  completions:                   "Completions",
  production_facilities_install: "Production Facilities Install",
  workovers:                     "Workovers",
  re_completions:                "Re-Completions",
  logging_testing_science:       "Logging / Testing / Science",
  artificial_lift_installation:  "Artificial Lift Installation",
};

const STATUS_COLORS: Record<JobStatus, string> = {
  active:    "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200",
  completed: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  suspended: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
};

const STATUS_LABELS: Record<JobStatus, string> = {
  active: "Active", completed: "Completed", suspended: "Suspended",
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

interface JobsListProps {
  wellId: string;
  siteId: string;
  initialJobs: Job[];
}

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

export function JobsList({ wellId, siteId, initialJobs }: JobsListProps) {
  const [jobItems, setJobItems] = useState<Job[]>(initialJobs);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editJob, setEditJob] = useState<Job | null>(null);

  const reload = useCallback(async () => {
    const res = await fetch(`/api/v1/jobs?wellId=${wellId}`);
    const json = await res.json();
    if (json.data) setJobItems(json.data);
  }, [wellId]);

  function openAdd() {
    setEditJob(null);
    setDialogOpen(true);
  }

  function openEdit(job: Job) {
    setEditJob(job);
    setDialogOpen(true);
  }

  function handleSuccess() {
    setDialogOpen(false);
    reload();
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-800">{jobItems.length}</span>{" "}
          {jobItems.length === 1 ? "job" : "jobs"}
        </p>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
        >
          <span>+</span> Add job
        </button>
      </div>

      {/* Empty state */}
      {jobItems.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
          <p className="text-sm font-medium text-gray-900">No jobs on this well</p>
          <p className="mt-1 text-sm text-gray-500">
            Create a job to start daily field reporting.
          </p>
          <button
            onClick={openAdd}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            <span>+</span> Add job
          </button>
        </div>
      )}

      {/* Jobs table */}
      {jobItems.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dist. time</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {jobItems.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-400 font-mono">
                    {job.jobNumber}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{job.name}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {MODULE_LABELS[job.module]}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[job.status]}`}>
                      {STATUS_LABELS[job.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(job.startDate)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                    {job.distributionTime}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => openEdit(job)}
                        className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                      >
                        Edit
                      </button>
                      <Link
                        href={`/sites/${siteId}/wells/${wellId}/jobs/${job.id}`}
                        className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                      >
                        Reports →
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <JobFormDialog
        open={dialogOpen}
        wellId={wellId}
        job={editJob}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
