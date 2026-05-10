"use client";

import { useState, useEffect } from "react";

const VENDOR_CATEGORIES = [
  "Drilling", "Completions", "Cementing", "Directional Drilling",
  "Mud Logging", "Mud Engineering", "Wireline / Perforating",
  "Coiled Tubing", "Fishing / Rental Tools", "Location Construction",
  "Trucking / Vacuum", "Water Hauling", "Production Services",
  "Flowback", "Well Testing", "Safety / H2S", "Catering", "Other",
];

interface Vendor {
  id: string;
  name: string;
  category: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
}

interface VendorFormData {
  name: string;
  category: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
}

const EMPTY: VendorFormData = {
  name: "", category: "", contactName: "", contactPhone: "", contactEmail: "",
};

interface VendorFormDialogProps {
  open: boolean;
  vendor?: Vendor | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function VendorFormDialog({ open, vendor, onClose, onSuccess }: VendorFormDialogProps) {
  const isEdit = !!vendor;
  const [form, setForm] = useState<VendorFormData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(vendor
        ? {
            name: vendor.name,
            category: vendor.category ?? "",
            contactName: vendor.contactName ?? "",
            contactPhone: vendor.contactPhone ?? "",
            contactEmail: vendor.contactEmail ?? "",
          }
        : EMPTY
      );
      setError(null);
    }
  }, [open, vendor]);

  function set(field: keyof VendorFormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const payload = {
      name: form.name,
      category: form.category || undefined,
      contactName: form.contactName || undefined,
      contactPhone: form.contactPhone || undefined,
      contactEmail: form.contactEmail || undefined,
    };
    try {
      const res = await fetch(
        isEdit ? `/api/v1/vendors/${vendor!.id}` : "/api/v1/vendors",
        { method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
      );
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Failed to save vendor"); return; }
      onSuccess();
    } catch { setError("Network error — please try again"); }
    finally { setLoading(false); }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-900">{isEdit ? "Edit vendor" : "Add vendor"}</h2>
          <p className="mt-1 text-sm text-gray-500">Service companies used on your jobs.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company name <span className="text-red-500">*</span></label>
            <input type="text" required placeholder="Smith Drilling Services" value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select value={form.category} onChange={(e) => set("category", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent">
              <option value="">— Select —</option>
              {VENDOR_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact name</label>
              <input type="text" placeholder="John Smith" value={form.contactName}
                onChange={(e) => set("contactName", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" placeholder="432-555-0100" value={form.contactPhone}
                onChange={(e) => set("contactPhone", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" placeholder="john@smithdrilling.com" value={form.contactEmail}
              onChange={(e) => set("contactEmail", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
          </div>
          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
              {loading ? "Saving…" : isEdit ? "Save changes" : "Add vendor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
