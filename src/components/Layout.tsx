import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Building2,
  CreditCard,
  Gift,
  Mail,
  LogOut,
  Zap,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/users", icon: Users, label: "Users" },
  { to: "/account-requests", icon: UserCheck, label: "Requests" },
  { to: "/workspaces", icon: Building2, label: "Workspaces" },
  { to: "/subscriptions", icon: CreditCard, label: "Subscriptions" },
  { to: "/offers", icon: Gift, label: "Offers" },
  { to: "/campaigns", icon: Mail, label: "Campaigns" },
];

export default function Layout() {
  const { status, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 lg:flex-row">
      {/* Sidebar */}
      <aside className="flex w-full flex-col bg-indigo-950 text-white shadow-2xl lg:h-screen lg:w-64">
        <div className="border-b border-white/10 p-4 lg:p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 shadow-lg">
              <Zap size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Owner Console</h1>
              <p className="text-xs text-indigo-300">
                Platform-wide control
              </p>
            </div>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 py-3 lg:flex-1 lg:flex-col lg:overflow-visible lg:py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all lg:mb-1 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "text-indigo-200 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden border-t border-white/10 p-4 lg:block">
          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-white/10 px-4 py-3 text-sm font-medium text-indigo-200 transition-all hover:border-red-500/50 hover:bg-red-500/20 hover:text-white"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
        <main className="min-w-0 flex-1 overflow-auto">
          <header className="sticky top-0 z-20 flex flex-col gap-3 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Owner admin</p>
              <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Users, workspaces, billing, and platform activity</h2>
            </div>
            <div className="flex items-center justify-between gap-3 text-left lg:block lg:text-right">
              <p className="text-sm font-medium text-slate-900">{status?.user?.username}</p>
              <p className="text-xs text-slate-500">Client users sign in from the main app</p>
              <button
                onClick={logout}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 lg:hidden"
              >
                Sign Out
              </button>
            </div>
          </header>
          <Outlet />
        </main>
    </div>
  );
}
