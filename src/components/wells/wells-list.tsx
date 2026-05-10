"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { WellFormDialog } from "./well-form-dialog";

type WellStatus = "planned" | "active" | "inactive" | "abandoned";

const STATUS_COLORS: Record<WellStatus, string> = {
  planned:   "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  active:    "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200",
  inactive:  "bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-200",
  abandoned: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
};

const STATUS_LABELS: Record<WellStatus, string> = {
  planned: "Planned", active: "Active", inactive: "Inactive", abandoned: "Abandoned",
};

interface Well {
  id: string;
  siteId: string;
  name: string;
  apiNumber: string | null;
  status: WellStatus;
  spudDate: string | null;
  tdDepth: number | null;
  createdAt: string;
}

interface WellsListProps {
  siteId: string;
  initialWells: Well[];
}

export function WellsList({ siteId, initialWells }: WellsListProps) {
  const [wells, setWells] = useState<Well[]>(initialWells);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editWell, setEditWell] = useState<Well | null>(null);

  const reload = useCallback(async () => {
    const res = await fetch(`/api/v1/wells?siteId=${siteId}`);
    const json = await res.json();
    if (json.data) setWells(json.data);
  }, [siteId]);

  function openAdd() {
    setEditWell(null);
    setDialogOpen(true);
  }

  function openEdit(well: Well) {
    setEditWell(well);
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
          <span className="font-semibold text-gray-800">{wells.length}</span>{" "}
          {wells.length === 1 ? "well" : "wells"}
        </p>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
        >
          <span>+</span> Add well
        </button>
      </div>

      {/* Empty state */}
      {wells.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
          <p className="text-sm font-medium text-gray-900">No wells on this site</p>
          <p className="mt-1 text-sm text-gray-500">Add your first well to start creating jobs.</p>
          <button
            onClick={openAdd}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            <span>+</span> Add well
          </button>
        </div>
      )}

      {/* Wells table */}
      {wells.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Well</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">API #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spud date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TD depth</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {wells.map((well) => (
                <tr key={well.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{well.name}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                    {well.apiNumber ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[well.status]}`}>
                      {STATUS_LABELS[well.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {well.spudDate
                      ? new Date(well.spudDate + "T12:00:00").toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {well.tdDepth ? `${well.tdDepth.toLocaleString()} ft` : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => openEdit(well)}
                        className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                      >
                        Edit
                      </button>
                      <Link
                        href={`/sites/${siteId}/wells/${well.id}`}
                        className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                      >
                        Jobs →
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <WellFormDialog
        open={dialogOpen}
        siteId={siteId}
        well={editWell}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
