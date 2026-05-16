import React, { useEffect, useState } from "react";
import {
  Users,
  Building2,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  CreditCard,
} from "lucide-react";
import { platformAdminApi, PlatformOverview } from "../api/client";

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
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100 hover:shadow-xl transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${color} shadow-md`}>
          <Icon size={24} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {subValue && (
            <p className="text-xs text-slate-400 mt-1">{subValue}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<PlatformOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    platformAdminApi
      .overview()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-slate-200 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { metrics } = data;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-500">Platform overview and key metrics</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          icon={Users}
          label="Total Users"
          value={metrics.total_users}
          subValue={`${metrics.active_users_30d} active (30d)`}
          color="bg-indigo-600"
        />
        <MetricCard
          icon={Building2}
          label="Workspaces"
          value={metrics.total_workspaces}
          subValue={`${metrics.total_sites} sites`}
          color="bg-indigo-600"
        />
        <MetricCard
          icon={ShoppingCart}
          label="Orders"
          value={metrics.total_orders}
          subValue={`${metrics.paid_orders} paid`}
          color="bg-indigo-600"
        />
        <MetricCard
          icon={DollarSign}
          label="Total Revenue"
          value={`$${metrics.total_revenue}`}
          color="bg-indigo-600"
        />
      </div>

      {/* Subscription Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard
          icon={CreditCard}
          label="Active Subscriptions"
          value={metrics.subscriptions_active}
          color="bg-indigo-600"
        />
        <MetricCard
          icon={TrendingUp}
          label="MRR"
          value={`$${metrics.mrr}`}
          color="bg-indigo-600"
        />
        <MetricCard
          icon={CreditCard}
          label="Trialing"
          value={metrics.subscriptions_trialing}
          subValue={`${metrics.subscriptions_past_due} past due`}
          color="bg-indigo-600"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Recent Users</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {data.recent_users.map((user) => (
              <div key={user.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">{user.username}</p>
                  <p className="text-sm text-slate-500">{user.email}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    user.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {user.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Workspaces */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Recent Workspaces</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {data.recent_workspaces.map((ws) => (
              <div key={ws.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">{ws.name}</p>
                  <p className="text-sm text-slate-500">{ws.owner_username}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-600">{ws.site_count} sites</p>
                  <p className="text-xs text-slate-400">{ws.member_count} members</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="mt-6 bg-white rounded-2xl shadow-lg border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Order
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Site
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Total
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.recent_orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-5 py-3 text-sm font-medium text-slate-900">
                    {order.order_number}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600">
                    {order.site_name}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600">
                    ${order.total}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        order.payment_status === "paid"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {order.payment_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
