import React, { useEffect, useState } from "react";
import { Play, Pause } from "lucide-react";
import { platformAdminApi, PlatformSubscription } from "../api/client";

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState<PlatformSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const data = await platformAdminApi.subscriptions();
      setSubscriptions(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const handlePause = async (id: number) => {
    try {
      setActionLoading(id);
      await platformAdminApi.pauseSubscription(id);
      await loadSubscriptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to pause subscription");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResume = async (id: number) => {
    try {
      setActionLoading(id);
      await platformAdminApi.resumeSubscription(id);
      await loadSubscriptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resume subscription");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
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
      case "expired":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Subscriptions</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : subscriptions.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No subscriptions found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Workspace
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Plan
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Billing
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  MRR
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Started
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subscriptions.map((sub) => (
                <tr key={sub.id}>
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-medium text-slate-900">
                        {sub.workspace_name || `Workspace #${sub.workspace}`}
                      </p>
                      {sub.owner_username && (
                        <p className="text-sm text-slate-500">{sub.owner_username}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">{sub.plan}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getStatusColor(sub.status)}`}
                    >
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {sub.billing_cycle}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    ${sub.monthly_recurring_revenue}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {new Date(sub.started_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    {sub.status === "paused" ? (
                      <button
                        onClick={() => handleResume(sub.id)}
                        disabled={actionLoading === sub.id}
                        className="flex items-center gap-1.5 text-sm text-green-600 hover:bg-green-50 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                      >
                        <Play size={16} />
                        Resume
                      </button>
                    ) : sub.status === "active" || sub.status === "trialing" ? (
                      <button
                        onClick={() => handlePause(sub.id)}
                        disabled={actionLoading === sub.id}
                        className="flex items-center gap-1.5 text-sm text-amber-600 hover:bg-amber-50 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                      >
                        <Pause size={16} />
                        Pause
                      </button>
                    ) : null}
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
