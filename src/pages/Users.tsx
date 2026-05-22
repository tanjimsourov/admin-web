import React, { useEffect, useState, useCallback } from "react";
import { Lock, Plus, Search, Unlock, UserCheck, UserX } from "lucide-react";
import { platformAdminApi, PlatformUser } from "../api/client";

const packageOptions = [
  { value: "sites_2", label: "2 sites" },
  { value: "sites_5", label: "5 sites" },
  { value: "sites_10", label: "10 sites" },
  { value: "unlimited_contact", label: "Unlimited / contact" },
];

export default function Users() {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: "",
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    package: "sites_2",
    is_active: true,
    create_workspace: true,
  });

  const loadUsers = useCallback(async (query?: string) => {
    try {
      setLoading(true);
      const data = await platformAdminApi.users(query);
      setUsers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers(search);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.email.trim()) {
      setError("Email is required.");
      return;
    }
    try {
      setCreating(true);
      await platformAdminApi.createUser({
        ...createForm,
        email: createForm.email.trim().toLowerCase(),
        username: createForm.username.trim() || undefined,
        password: createForm.password || undefined,
      });
      setCreateForm({
        email: "",
        username: "",
        password: "",
        first_name: "",
        last_name: "",
        package: "sites_2",
        is_active: true,
        create_workspace: true,
      });
      await loadUsers(search);
    } catch (err) {
      setError(err instanceof Error ? err.message : "User creation failed");
    } finally {
      setCreating(false);
    }
  };

  const handlePackageChange = async (user: PlatformUser, packageId: string) => {
    try {
      setActionLoading(user.id);
      await platformAdminApi.updateUserPackage(user.id, packageId);
      await loadUsers(search);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Package update failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (user: PlatformUser) => {
    try {
      setActionLoading(user.id);
      if (user.is_active) {
        await platformAdminApi.deactivateUser(user.id);
      } else {
        await platformAdminApi.activateUser(user.id);
      }
      await loadUsers(search);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleLock = async (user: PlatformUser) => {
    try {
      setActionLoading(user.id);
      if (user.account_status === "locked") {
        await platformAdminApi.unlockUser(user.id);
      } else {
        await platformAdminApi.lockUser(user.id);
      }
      await loadUsers(search);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Account lock update failed");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Users</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleCreateUser} className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Plus size={18} className="text-primary-600" />
          <h2 className="font-semibold text-slate-900">Create user</h2>
          <span className="text-xs text-slate-500">Owner-created accounts skip paid checkout but still receive package limits.</span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Email" type="email" value={createForm.email} onChange={(event) => setCreateForm((current) => ({ ...current, email: event.target.value }))} required />
          <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Username (optional)" value={createForm.username} onChange={(event) => setCreateForm((current) => ({ ...current, username: event.target.value }))} />
          <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Temporary password (optional)" type="password" value={createForm.password} onChange={(event) => setCreateForm((current) => ({ ...current, password: event.target.value }))} />
          <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={createForm.package} onChange={(event) => setCreateForm((current) => ({ ...current, package: event.target.value }))}>
            {packageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="First name" value={createForm.first_name} onChange={(event) => setCreateForm((current) => ({ ...current, first_name: event.target.value }))} />
          <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Last name" value={createForm.last_name} onChange={(event) => setCreateForm((current) => ({ ...current, last_name: event.target.value }))} />
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={createForm.is_active}
              onChange={(event) =>
                setCreateForm((current) => ({
                  ...current,
                  is_active: event.target.checked,
                  create_workspace: event.target.checked ? current.create_workspace : false,
                }))
              }
            />
            Active
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={createForm.create_workspace && createForm.is_active}
              disabled={!createForm.is_active}
              onChange={(event) => setCreateForm((current) => ({ ...current, create_workspace: event.target.checked }))}
            />
            Create workspace
          </label>
        </div>
        <button type="submit" disabled={creating} className="mt-3 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-50">
          {creating ? "Creating..." : "Create user"}
        </button>
      </form>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No users found</div>
        ) : (
          <table className="w-full min-w-[980px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  User
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Joined
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Last Login
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Workspaces
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Sites
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Package
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-medium text-slate-900">
                        {user.username}
                        {user.is_superuser && (
                          <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                            Admin
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {new Date(user.date_joined).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {user.last_login
                      ? new Date(user.last_login).toLocaleDateString()
                      : "Never"}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {user.workspace_count}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {user.site_count}
                  </td>
                  <td className="px-5 py-4">
                    <select
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                      value={user.package || "sites_2"}
                      disabled={actionLoading === user.id || user.is_superuser}
                      onChange={(event) => handlePackageChange(user, event.target.value)}
                    >
                      {packageOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-slate-400">
                      {user.contact_required ? "Contact pricing" : user.site_limit ? `${user.site_limit} site limit` : "Unlimited"}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`w-fit text-xs px-2 py-1 rounded-full ${
                          user.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                      {user.account_status && (
                        <span
                          className={`w-fit text-xs px-2 py-1 rounded-full ${
                            user.account_status === "active"
                              ? "bg-slate-100 text-slate-600"
                              : user.account_status === "locked"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {user.account_status.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {!user.is_superuser && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleToggleActive(user)}
                          disabled={actionLoading === user.id}
                          className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded transition-colors ${
                            user.is_active
                              ? "text-red-600 hover:bg-red-50"
                              : "text-green-600 hover:bg-green-50"
                          } disabled:opacity-50`}
                        >
                          {user.is_active ? (
                            <>
                              <UserX size={16} />
                              Suspend
                            </>
                          ) : (
                            <>
                              <UserCheck size={16} />
                              Activate
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleToggleLock(user)}
                          disabled={actionLoading === user.id}
                          className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded transition-colors ${
                            user.account_status === "locked"
                              ? "text-green-600 hover:bg-green-50"
                              : "text-amber-600 hover:bg-amber-50"
                          } disabled:opacity-50`}
                        >
                          {user.account_status === "locked" ? (
                            <>
                              <Unlock size={16} />
                              Unlock
                            </>
                          ) : (
                            <>
                              <Lock size={16} />
                              Lock
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}


