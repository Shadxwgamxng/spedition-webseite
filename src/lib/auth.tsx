"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";

export type EmployeeUser = {
  username: string;
  name: string;
  role: string;
  department: string;
};

const DEMO_ACCOUNTS: Record<string, { password: string; user: EmployeeUser }> = {
  disposition: {
    password: "baltic2026",
    user: { username: "disposition", name: "Marek Nowicki", role: "Leiter Disposition", department: "Disposition" },
  },
  lager: {
    password: "baltic2026",
    user: { username: "lager", name: "Sandra Lehmann", role: "Leiterin Lagerlogistik", department: "Lager" },
  },
  fuhrpark: {
    password: "baltic2026",
    user: { username: "fuhrpark", name: "Jonas Petersen", role: "Leiter Fuhrparkmanagement", department: "Fuhrpark & Werkstatt" },
  },
  buchhaltung: {
    password: "baltic2026",
    user: { username: "buchhaltung", name: "Dennis Kramer", role: "Leiter Buchhaltung", department: "Finanzbuchhaltung" },
  },
  admin: {
    password: "baltic2026",
    user: { username: "admin", name: "Torsten Wegner", role: "Geschäftsführer", department: "Geschäftsleitung" },
  },
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
  login: (username: string, password: string) => { ok: boolean; error?: string };
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

  function login(username: string, password: string) {
    const account = DEMO_ACCOUNTS[username.trim().toLowerCase()];
    if (!account || account.password !== password) {
      return { ok: false, error: "Benutzername oder Passwort ist falsch." };
    }
    persistUser(account.user);
    return { ok: true };
  }

  function logout() {
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

export const demoAccountHints = Object.values(DEMO_ACCOUNTS).map((a) => ({
  username: a.user.username,
  department: a.user.department,
}));
