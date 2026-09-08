"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Single shared employee login for the "Website-Verwaltung" CMS area. Deliberately
 * simple (one account, no roles) — this is a demo-grade, client-side-only auth
 * check with no server-side session/authorization (see README before a real launch).
 */
const ADMIN_USERNAME = "verwaltung";
const ADMIN_PASSWORD = "zeQ4Q674HMLsoaXn";

const STORAGE_KEY = "baltic-freight-admin-session";

type AuthContextValue = {
  /** false until the localStorage session has been read on the client at least once. */
  ready: boolean;
  loggedIn: boolean;
  login: (username: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readSession(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    // Runs once on mount: reads the real client-side session, then flags
    // `ready` so consumers (e.g. a login-required redirect) wait for this
    // before deciding the visitor is logged out — SSR has no localStorage,
    // so the pre-mount value would otherwise always read as "not logged in".
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoggedIn(readSession());
    setReady(true);

    function onStorage() {
      setLoggedIn(readSession());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = useCallback((username: string, password: string) => {
    if (username.trim().toLowerCase() !== ADMIN_USERNAME.toLowerCase() || password !== ADMIN_PASSWORD) {
      return { ok: false, error: "Benutzername oder Passwort ist falsch." };
    }
    window.localStorage.setItem(STORAGE_KEY, "1");
    setLoggedIn(true);
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setLoggedIn(false);
  }, []);

  const value = useMemo(() => ({ ready, loggedIn, login, logout }), [ready, loggedIn, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
