import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import LoginPage from "./components/LoginPage";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Workspaces from "./pages/Workspaces";
import Subscriptions from "./pages/Subscriptions";
import Offers from "./pages/Offers";
import Campaigns from "./pages/Campaigns";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { status, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!status?.authenticated || !status.user?.is_superuser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { status, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (status?.authenticated && status.user?.is_superuser) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="workspaces" element={<Workspaces />} />
        <Route path="subscriptions" element={<Subscriptions />} />
        <Route path="offers" element={<Offers />} />
        <Route path="campaigns" element={<Campaigns />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
