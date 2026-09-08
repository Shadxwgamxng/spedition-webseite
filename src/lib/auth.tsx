"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { RoleKey } from "@/lib/roles";

export type EmployeeUser = {
  id: string;
  username: string;
  discordId: string;
  discordUsername: string;
  name: string;
  role: string;
  roleKey: RoleKey;
  department: string;
};

type AuthContextValue = {
  user: EmployeeUser | null;
  status: "loading" | "ready";
  refresh: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<EmployeeUser | null>(null);
  const [status, setStatus] = useState<"loading" | "ready">("loading");

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      const json = await res.json();
      setUser(json.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setStatus("ready");
    }
  }, []);

  useEffect(() => {
    // Runs once on mount: the session lives in an httpOnly cookie (set by the
    // Discord OAuth callback), so it can only be read by asking the server —
    // there's nothing to synchronously read from localStorage here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const logout = useCallback(() => {
    if (user?.roleKey === "fahrer") {
      fetch("/api/vehicles/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverName: user.name }),
      }).catch(() => {
        // best-effort: session is cleared either way
      });
    }
    fetch("/api/auth/logout", { method: "POST" })
      .catch(() => {})
      .finally(() => setUser(null));
  }, [user]);

  const value: AuthContextValue = { user, status, refresh, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
