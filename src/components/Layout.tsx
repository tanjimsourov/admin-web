import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  CreditCard,
  Gift,
  Mail,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/users", icon: Users, label: "Users" },
  { to: "/workspaces", icon: Building2, label: "Workspaces" },
  { to: "/subscriptions", icon: CreditCard, label: "Subscriptions" },
  { to: "/offers", icon: Gift, label: "Offers" },
  { to: "/campaigns", icon: Mail, label: "Campaigns" },
];

export default function Layout() {
  const { status, logout } = useAuth();

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-950 text-white flex flex-col shadow-2xl">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold">Platform Admin</h1>
              <p className="text-xs text-indigo-300">
                {status?.user?.username}
              </p>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-4 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 mb-1 text-sm font-medium rounded-xl transition-all ${
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
        <div className="p-4 border-t border-white/10">
          <button
            onClick={logout}
            className="flex items-center justify-center gap-3 px-4 py-3 text-sm font-medium text-indigo-200 hover:bg-red-500/20 hover:text-white transition-all w-full rounded-xl border border-white/10 hover:border-red-500/50"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
