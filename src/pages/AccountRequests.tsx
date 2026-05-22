import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Crown, Search, XCircle } from "lucide-react";
import { platformAdminApi, PlatformAccountRequest } from "../api/client";

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "active", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

function statusColor(status: string) {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-700";
    case "pending":
      return "bg-amber-100 text-amber-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function packageLabel(request: PlatformAccountRequest) {
  if (request.contact_required || request.package === "unlimited_contact") return "Enterprise / contact";
  if (request.site_limit) return `${request.site_limit} sites`;
  return request.package.replace(/_/g, " ");
}

export default function AccountRequests() {
  const [requests, setRequests] = useState<PlatformAccountRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await platformAdminApi.accountRequests(statusFilter, search.trim() || undefined);
      setRequests(data.results);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load account requests");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    void loadRequests();
  };

  const handleApprove = async (request: PlatformAccountRequest) => {
    try {
      setActionLoading(request.user_id);
      await platformAdminApi.approveAccount(request.user_id);
      await loadRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve account");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (request: PlatformAccountRequest) => {
    const reason = window.prompt("Reason for rejection", "Account request rejected by platform owner");
    if (!reason) return;
    try {
      setActionLoading(request.user_id);
      await platformAdminApi.rejectAccount(request.user_id, reason);
      await loadRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject account");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Account Requests</h1>
          <p className="mt-1 text-sm text-slate-500">Approve or reject public signup requests without touching billing checkout.</p>
        </div>
        <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search requests..."
              className="w-64 rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button type="submit" className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
            Search
          </button>
        </form>
      </div>

      {error ? <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div> : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-slate-400">Visible requests</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{requests.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-slate-400">Enterprise</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{requests.filter((request) => request.contact_required || request.package === "unlimited_contact").length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-slate-400">Marketing opt-in</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{requests.filter((request) => request.marketing_opt_in).length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-slate-400">Pending</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{requests.filter((request) => request.status === "pending").length}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No account requests found</div>
        ) : (
          <table className="w-full min-w-[860px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-slate-500">Account</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-slate-500">Plan Request</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-slate-500">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-slate-500">Requested</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((request) => (
                <tr key={request.id}>
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-900">{request.display_name || request.username}</p>
                    <p className="text-sm text-slate-500">{request.email || request.user_email}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      {(request.contact_required || request.package === "unlimited_contact") ? <Crown size={16} className="text-amber-500" /> : null}
                      <p>{packageLabel(request)}</p>
                    </div>
                    <p className="text-xs text-slate-400">{request.user_category}</p>
                    {request.marketing_opt_in ? <p className="mt-1 text-xs text-green-600">Marketing opt-in</p> : null}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2 py-1 text-xs ${statusColor(request.status)}`}>
                      {request.status.replace(/_/g, " ")}
                    </span>
                    {request.rejection_reason ? <p className="mt-1 max-w-xs text-xs text-slate-500">{request.rejection_reason}</p> : null}
                    {request.approved_by_username ? <p className="mt-1 text-xs text-slate-400">Approved by {request.approved_by_username}</p> : null}
                    {request.rejected_by_username ? <p className="mt-1 text-xs text-slate-400">Rejected by {request.rejected_by_username}</p> : null}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">{new Date(request.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-4">
                    {request.status === "pending" ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleApprove(request)}
                          disabled={actionLoading === request.user_id}
                          className="flex items-center gap-1.5 rounded px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 disabled:opacity-50"
                        >
                          <CheckCircle2 size={16} />
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(request)}
                          disabled={actionLoading === request.user_id}
                          className="flex items-center gap-1.5 rounded px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <XCircle size={16} />
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">No action available</span>
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
