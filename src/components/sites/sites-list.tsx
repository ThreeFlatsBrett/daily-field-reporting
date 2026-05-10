"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { SiteFormDialog } from "./site-form-dialog";

interface Site {
  id: string;
  name: string;
  state: string | null;
  county: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
}

interface SitesListProps {
  initialSites: Site[];
  wellCounts: Record<string, number>;
}

export function SitesList({ initialSites, wellCounts }: SitesListProps) {
  const [sites, setSites] = useState<Site[]>(initialSites);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editSite, setEditSite] = useState<Site | null>(null);

  const reload = useCallback(async () => {
    const res = await fetch("/api/v1/sites");
    const json = await res.json();
    if (json.data) setSites(json.data);
  }, []);

  function openAdd() {
    setEditSite(null);
    setDialogOpen(true);
  }

  function openEdit(site: Site) {
    setEditSite(site);
    setDialogOpen(true);
  }

  function handleSuccess() {
    setDialogOpen(false);
    reload();
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Sites &amp; Wells</h1>
          <p className="mt-1 text-sm text-gray-500">
            {sites.length} {sites.length === 1 ? "site" : "sites"}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
        >
          <span>+</span> Add site
        </button>
      </div>

      {/* Empty state */}
      {sites.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <p className="text-sm font-medium text-gray-900">No sites yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Add your first site to start tracking wells and jobs.
          </p>
          <button
            onClick={openAdd}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            <span>+</span> Add site
          </button>
        </div>
      )}

      {/* Sites grid */}
      {sites.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sites.map((site) => {
            const wellCount = wellCounts[site.id] ?? 0;
            const location = [site.county, site.state].filter(Boolean).join(", ");

            return (
              <div
                key={site.id}
                className="group relative bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all"
              >
                {/* Site info */}
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-gray-900 group-hover:text-gray-700">
                    {site.name}
                  </h3>
                  {location && (
                    <p className="mt-0.5 text-sm text-gray-500">{location}</p>
                  )}
                  {site.address && (
                    <p className="mt-0.5 text-xs text-gray-400 truncate">{site.address}</p>
                  )}
                </div>

                {/* Well count */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-800">{wellCount}</span>{" "}
                    {wellCount === 1 ? "well" : "wells"}
                  </span>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => openEdit(site)}
                      className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      Edit
                    </button>
                    <Link
                      href={`/sites/${site.id}`}
                      className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                    >
                      View wells →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SiteFormDialog
        open={dialogOpen}
        site={editSite}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
