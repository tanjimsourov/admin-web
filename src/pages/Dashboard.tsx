import React, { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Building2,
  CreditCard,
  DollarSign,
  Gift,
  Mail,
  Server,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  platformAdminApi,
  PlatformBillingSummary,
  PlatformIntegrationStatus,
  PlatformOperationsSummary,
  PlatformOverview,
} from "../api/client";

interface DashboardState {
  overview: PlatformOverview | null;
  billing: PlatformBillingSummary | null;
  integrations: PlatformIntegrationStatus | null;
  operations: PlatformOperationsSummary | null;
  notices: string[];
}

function MetricCard({
  icon: Icon,
  label,
  value,
  subValue,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${color}`}>
          <Icon size={22} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="truncate text-2xl font-bold text-slate-900">{value}</p>
          {subValue ? <p className="mt-1 text-xs text-slate-400">{subValue}</p> : null}
        </div>
      </div>
    </div>
  );
}

function statusTone(status: string) {
  if (status === "ok" || status === "active" || status === "healthy") return "bg-green-100 text-green-700";
  if (status === "degraded" || status === "trialing" || status === "pending") return "bg-amber-100 text-amber-700";
  if (status === "error" || status === "failed" || status === "past_due") return "bg-red-100 text-red-700";
  return "bg-slate-100 text-slate-600";
}

function formatCurrency(value: string | number | undefined) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return "$0";
  return amount.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

function firstError(result: PromiseSettledResult<unknown>, label: string): string | null {
  if (result.status === "fulfilled") return null;
  return `${label}: ${result.reason instanceof Error ? result.reason.message : "request failed"}`;
}

export default function Dashboard() {
  const [state, setState] = useState<DashboardState>({
    overview: null,
    billing: null,
    integrations: null,
    operations: null,
    notices: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      setLoading(true);
      setError(null);
      const [overviewResult, billingResult, integrationResult, operationsResult] = await Promise.allSettled([
        platformAdminApi.overview(),
        platformAdminApi.billingSummary(75),
        platformAdminApi.integrationStatus(),
        platformAdminApi.operationsSummary(),
      ]);

      if (!mounted) return;

      if (overviewResult.status === "rejected") {
        setError(overviewResult.reason instanceof Error ? overviewResult.reason.message : "Failed to load dashboard");
        setLoading(false);
        return;
      }

      setState({
        overview: overviewResult.value,
        billing: billingResult.status === "fulfilled" ? billingResult.value : null,
        integrations: integrationResult.status === "fulfilled" ? integrationResult.value : null,
        operations: operationsResult.status === "fulfilled" ? operationsResult.value : null,
        notices: [firstError(billingResult, "Billing summary"), firstError(integrationResult, "Integration status"), firstError(operationsResult, "Operations summary")].filter(Boolean) as string[],
      });
      setLoading(false);
    }

    void loadDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-slate-200" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-lg bg-slate-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !state.overview) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error || "Dashboard data was unavailable."}
        </div>
      </div>
    );
  }

  const { metrics } = state.overview;
  const billingStatusCounts = state.billing?.summary.billing_status_counts || {};
  const integrationIssues = (state.integrations?.summary.error || 0) + (state.integrations?.summary.health_error || 0) + (state.integrations?.summary.health_degraded || 0);
  const failedJobs = Number(state.operations?.jobs.failed_last_window || 0);
  const failedWebhooks = Number(state.operations?.webhooks.failed_last_window || 0);
  const failedAi = Number(state.operations?.ai.failed_last_window || 0);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-900">Owner Dashboard</h1>
        <p className="max-w-4xl text-sm text-slate-500">
          Platform visibility across signup approvals, workspace limits, billing health, campaigns, integrations, and operational failures.
        </p>
      </div>

      {state.notices.length > 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <div className="flex items-start gap-2">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Some operational panels could not load.</p>
              <p className="mt-1">{state.notices.join(" ")}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Users} label="Total users" value={metrics.total_users} subValue={`${metrics.active_users_30d} active in 30 days`} color="bg-indigo-600" />
        <MetricCard icon={Building2} label="Workspaces" value={metrics.total_workspaces} subValue={`${metrics.total_sites} sites`} color="bg-cyan-600" />
        <MetricCard icon={ShoppingCart} label="Orders" value={metrics.total_orders} subValue={`${metrics.paid_orders} paid`} color="bg-emerald-600" />
        <MetricCard icon={DollarSign} label="Lifetime revenue" value={formatCurrency(state.billing?.summary.lifetime_paid_revenue || metrics.total_revenue)} color="bg-slate-700" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={CreditCard} label="Active subscriptions" value={metrics.subscriptions_active} subValue={`${metrics.subscriptions_past_due} past due`} color="bg-indigo-600" />
        <MetricCard icon={TrendingUp} label="MRR" value={formatCurrency(state.billing?.summary.total_mrr || metrics.mrr)} subValue={`${metrics.subscriptions_trialing} trialing`} color="bg-teal-600" />
        <MetricCard icon={Gift} label="Active offers" value={metrics.active_offers} color="bg-fuchsia-600" />
        <MetricCard icon={Mail} label="Sent campaigns" value={metrics.sent_campaigns} color="bg-rose-600" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900">Billing And Plan Health</h2>
              <p className="text-sm text-slate-500">Server-side workspace quotas and subscription states from the billing summary API.</p>
            </div>
            <span className={`rounded-full px-2 py-1 text-xs ${statusTone(integrationIssues || failedJobs || failedWebhooks || failedAi ? "degraded" : "ok")}`}>
              {integrationIssues || failedJobs || failedWebhooks || failedAi ? "needs review" : "ok"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {["active", "trialing", "past_due", "unconfigured"].map((key) => (
              <div key={key} className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs uppercase text-slate-400">{key.replace(/_/g, " ")}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{billingStatusCounts[key] || 0}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Workspace</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Usage</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">MRR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(state.billing?.results || []).slice(0, 6).map((workspace) => (
                  <tr key={workspace.workspace_id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{workspace.workspace_name}</p>
                      <p className="text-xs text-slate-500">{workspace.workspace_slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs ${statusTone(workspace.billing_status)}`}>{workspace.billing_status}</span>
                      <p className="mt-1 text-xs text-slate-500">{workspace.billing_plan || workspace.plan_tier}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {workspace.usage.sites_total || 0}/{workspace.limits.max_sites ?? workspace.limits.sites ?? "unlimited"} sites
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(workspace.mrr)}</td>
                  </tr>
                ))}
                {state.billing && state.billing.results.length === 0 ? (
                  <tr>
                    <td className="px-4 py-5 text-sm text-slate-500" colSpan={4}>No billing workspace snapshots returned.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Server size={18} className="text-slate-500" />
              <h2 className="font-bold text-slate-900">Integrations</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs uppercase text-slate-400">Installed</p>
                <p className="text-2xl font-bold text-slate-900">{state.integrations?.summary.installed || 0}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs uppercase text-slate-400">Issues</p>
                <p className="text-2xl font-bold text-slate-900">{integrationIssues}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-slate-500" />
                <h2 className="font-bold text-slate-900">Operations</h2>
              </div>
              <span className={`rounded-full px-2 py-1 text-xs ${statusTone(state.operations?.status || "pending")}`}>{state.operations?.status || "pending"}</span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Jobs failed in window</span>
                <span className="font-semibold text-slate-900">{failedJobs}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Webhook failures</span>
                <span className="font-semibold text-slate-900">{failedWebhooks}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">AI failures</span>
                <span className="font-semibold text-slate-900">{failedAi}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-slate-900">Recent Users</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {state.overview.recent_users.map((user) => (
              <div key={user.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{user.username}</p>
                  <p className="truncate text-sm text-slate-500">{user.email}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-1 text-xs ${user.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {user.account_status || (user.is_active ? "active" : "inactive")}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-slate-900">Recent Workspaces</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {state.overview.recent_workspaces.map((workspace) => (
              <div key={workspace.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{workspace.name}</p>
                  <p className="truncate text-sm text-slate-500">{workspace.owner_username}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm text-slate-600">{workspace.site_count} sites</p>
                  <p className="text-xs text-slate-400">{workspace.member_count} members</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
