"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type PortalCustomer = {
  id: string;
  customerNumber: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
};

type CustomerAuthContextValue = {
  customer: PortalCustomer | null;
  status: "loading" | "ready";
  refresh: () => Promise<void>;
  logout: () => void;
};

const CustomerAuthContext = createContext<CustomerAuthContextValue | null>(null);

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<PortalCustomer | null>(null);
  const [status, setStatus] = useState<"loading" | "ready">("loading");

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/customer/session", { cache: "no-store" });
      const json = await res.json();
      setCustomer(json.customer ?? null);
    } catch {
      setCustomer(null);
    } finally {
      setStatus("ready");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const logout = useCallback(() => {
    fetch("/api/auth/customer/logout", { method: "POST" })
      .catch(() => {})
      .finally(() => setCustomer(null));
  }, []);

  const value: CustomerAuthContextValue = { customer, status, refresh, logout };

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>;
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error("useCustomerAuth must be used within a CustomerAuthProvider");
  return ctx;
}
