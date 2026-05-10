"use client";

import { useState, useCallback } from "react";
import { InviteUserDialog } from "./invite-user-dialog";
import { EditRoleDialog } from "./edit-role-dialog";

type Role = "admin" | "editor" | "operated_viewer" | "partner_user";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  isPending: boolean; // true = invited but hasn't signed up yet
  createdAt: string;
}

const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  editor: "Editor",
  operated_viewer: "Operated Viewer",
  partner_user: "Partner User",
};

const ROLE_COLORS: Record<Role, string> = {
  admin:
    "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200",
  editor:
    "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  operated_viewer:
    "bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-200",
  partner_user:
    "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
};

interface UsersTableProps {
  initialUsers: UserRow[];
  currentUserId: string; // our DB user id — prevent self-actions
}

export function UsersTable({ initialUsers, currentUserId }: UsersTableProps) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const res = await fetch("/api/v1/users");
    const json = await res.json();
    if (json.data) setUsers(json.data);
  }, []);

  async function toggleActive(user: UserRow) {
    setTogglingId(user.id);
    try {
      await fetch(`/api/v1/users/${user.id}`, { method: "DELETE" });
      await reload();
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <>
      {/* Header bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Team members</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {users.length} {users.length === 1 ? "user" : "users"}
          </p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
        >
          <span>+</span>
          Invite user
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-sm text-gray-400"
                >
                  No users yet. Invite your first team member.
                </td>
              </tr>
            )}
            {users.map((user) => {
              const isSelf = user.id === currentUserId;
              const isToggling = togglingId === user.id;

              return (
                <tr
                  key={user.id}
                  className={`transition-colors ${!user.isActive ? "bg-gray-50/50 opacity-60" : "hover:bg-gray-50/50"}`}
                >
                  {/* Name + email */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600 shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user.name}
                          {isSelf && (
                            <span className="ml-2 text-xs text-gray-400">(you)</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role badge */}
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[user.role]}`}
                    >
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    {user.isPending ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        Invite pending
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium ${user.isActive ? "text-green-700" : "text-gray-400"}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${user.isActive ? "bg-green-500" : "bg-gray-300"}`}
                        />
                        {user.isActive ? "Active" : "Deactivated"}
                      </span>
                    )}
                  </td>

                  {/* Joined date */}
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    {!isSelf ? (
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => setEditUser(user)}
                          className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                        >
                          Edit role
                        </button>
                        <button
                          onClick={() => toggleActive(user)}
                          disabled={isToggling}
                          className={`text-sm font-medium transition-colors ${
                            user.isActive
                              ? "text-red-500 hover:text-red-700"
                              : "text-green-600 hover:text-green-800"
                          } disabled:opacity-50`}
                        >
                          {isToggling
                            ? "…"
                            : user.isActive
                            ? "Deactivate"
                            : "Reactivate"}
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Dialogs */}
      <InviteUserDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSuccess={() => {
          setInviteOpen(false);
          reload();
        }}
      />

      <EditRoleDialog
        user={editUser}
        onClose={() => setEditUser(null)}
        onSuccess={() => {
          setEditUser(null);
          reload();
        }}
      />
    </>
  );
}
