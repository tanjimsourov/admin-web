import React, { useEffect, useState, useCallback } from "react";
import { Search } from "lucide-react";
import { platformAdminApi, PlatformWorkspace } from "../api/client";

export default function Workspaces() {
  const [workspaces, setWorkspaces] = useState<PlatformWorkspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadWorkspaces = useCallback(async (query?: string) => {
    try {
      setLoading(true);
      const data = await platformAdminApi.workspaces(query);
      setWorkspaces(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workspaces");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadWorkspaces(search);
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "trialing":
        return "bg-blue-100 text-blue-700";
      case "past_due":
        return "bg-yellow-100 text-yellow-700";
      case "paused":
        return "bg-gray-100 text-gray-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Workspaces</h1>
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
              placeholder="Search workspaces..."
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

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : workspaces.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No workspaces found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Workspace
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Owner
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Members
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Sites
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Subscription
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {workspaces.map((ws) => (
                <tr key={ws.id}>
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-medium text-slate-900">{ws.name}</p>
                      <p className="text-sm text-slate-500">{ws.slug}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div>
                      <p className="text-sm text-slate-900">{ws.owner_username}</p>
                      <p className="text-xs text-slate-500">{ws.owner_email}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {ws.member_count}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {ws.site_count}
                  </td>
                  <td className="px-5 py-4">
                    {ws.subscription_status ? (
                      <div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                            ws.subscription_status
                          )}`}
                        >
                          {ws.subscription_status}
                        </span>
                        {ws.subscription_plan && (
                          <p className="text-xs text-slate-500 mt-1">
                            {ws.subscription_plan}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">No subscription</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {new Date(ws.created_at).toLocaleDateString()}
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
