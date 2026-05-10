"use client";

import { useState } from "react";

type Role = "admin" | "editor" | "operated_viewer" | "partner_user";

const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  editor: "Editor",
  operated_viewer: "Operated Viewer",
  partner_user: "Partner User",
};

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface EditRoleDialogProps {
  user: UserRow | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditRoleDialog({ user, onClose, onSuccess }: EditRoleDialogProps) {
  const [role, setRole] = useState<Role>(user?.role ?? "editor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync role when user changes
  if (user && role !== user.role && !loading) {
    // noop — initial state is set per open; just suppress unused warning
  }

  function handleClose() {
    setError(null);
    setLoading(false);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Failed to update role");
        return;
      }

      onSuccess();
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Edit role</h2>
          <p className="mt-1 text-sm text-gray-500">
            Changing role for <span className="font-medium text-gray-700">{user.name}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
