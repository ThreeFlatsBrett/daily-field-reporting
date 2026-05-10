"use client";

import { useState, useCallback } from "react";
import { VendorFormDialog } from "./vendor-form-dialog";

interface Vendor {
  id: string;
  name: string;
  category: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
}

export function VendorsList({ initialVendors }: { initialVendors: Vendor[] }) {
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const res = await fetch("/api/v1/vendors");
    const json = await res.json();
    if (json.data) setVendors(json.data);
  }, []);

  function openAdd() { setEditVendor(null); setDialogOpen(true); }
  function openEdit(v: Vendor) { setEditVendor(v); setDialogOpen(true); }

  async function handleDelete(vendorId: string) {
    if (!confirm("Delete this vendor?")) return;
    setDeletingId(vendorId);
    await fetch(`/api/v1/vendors/${vendorId}`, { method: "DELETE" });
    await reload();
    setDeletingId(null);
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Vendors</h1>
          <p className="mt-1 text-sm text-gray-500">{vendors.length} {vendors.length === 1 ? "vendor" : "vendors"}</p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors">
          <span>+</span> Add vendor
        </button>
      </div>

      {vendors.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <p className="text-sm font-medium text-gray-900">No vendors yet</p>
          <p className="mt-1 text-sm text-gray-500">Add the service companies that work your jobs.</p>
          <button onClick={openAdd} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors">
            <span>+</span> Add vendor
          </button>
        </div>
      )}

      {vendors.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vendors.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{v.name}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {v.category ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    {v.contactName && <p className="text-sm text-gray-700">{v.contactName}</p>}
                    {v.contactPhone && <p className="text-xs text-gray-500">{v.contactPhone}</p>}
                    {v.contactEmail && <p className="text-xs text-gray-400">{v.contactEmail}</p>}
                    {!v.contactName && !v.contactPhone && !v.contactEmail && <span className="text-gray-300 text-sm">—</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => openEdit(v)} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Edit</button>
                      <button onClick={() => handleDelete(v.id)} disabled={deletingId === v.id}
                        className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors">
                        {deletingId === v.id ? "…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <VendorFormDialog open={dialogOpen} vendor={editVendor}
        onClose={() => setDialogOpen(false)}
        onSuccess={() => { setDialogOpen(false); reload(); }} />
    </>
  );
}
