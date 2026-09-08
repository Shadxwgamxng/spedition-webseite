"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import type { RoleKey } from "@/lib/roles";

export type EmployeeUser = {
  username: string;
  name: string;
  role: string;
  roleKey: RoleKey;
  department: string;
};

const STORAGE_KEY = "bf-employee-session";

let listeners: Array<() => void> = [];

function emitChange() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function getServerSnapshot(): string | null {
  return null;
}

function persistUser(user: EmployeeUser | null) {
  try {
    if (user) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore storage errors (e.g. private browsing)
  }
  emitChange();
}

type AuthContextValue = {
  user: EmployeeUser | null;
  status: "loading" | "ready";
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const user = useMemo<EmployeeUser | null>(() => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as EmployeeUser;
    } catch {
      return null;
    }
  }, [raw]);

  async function login(username: string, password: string) {
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        return { ok: false, error: json.error ?? "Anmeldung fehlgeschlagen." };
      }
      persistUser(json.user as EmployeeUser);
      return { ok: true };
    } catch {
      return { ok: false, error: "Verbindung zum Server fehlgeschlagen." };
    }
  }

  function logout() {
    if (user?.roleKey === "fahrer") {
      fetch("/api/vehicles/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverName: user.name }),
      }).catch(() => {
        // best-effort: local session is cleared either way
      });
    }
    persistUser(null);
  }

  const value: AuthContextValue = {
    user,
    status: hydrated ? "ready" : "loading",
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
