import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi, AuthStatus } from "../api/client";

interface AuthContextValue {
  status: AuthStatus | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  bootstrap: (
    payload: {
      email: string;
      password: string;
      first_name: string;
      last_name: string;
      bootstrap_token: string;
    }
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await authApi.status();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check auth");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const data = await authApi.login(username, password);
      setStatus(data);
      return data.authenticated && !!data.user?.is_superuser;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const bootstrap = async (payload: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    bootstrap_token: string;
  }): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const data = await authApi.bootstrap(payload);
      setStatus(data);
      return data.authenticated && !!data.user?.is_superuser;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bootstrap failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
      setStatus({ authenticated: false, has_users: true });
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ status, loading, error, login, bootstrap, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
