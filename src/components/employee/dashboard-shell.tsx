"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/site/logo";
import { employeeModules } from "@/lib/employee-nav";
import { CloseIcon, LockIcon, MenuIcon } from "@/components/ui/icons";
import { VehicleGate } from "@/components/employee/vehicle-gate";

export function DashboardShell({ children }: { children: ReactNode }) {
  const { user, status, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (status === "ready" && !user) {
      router.replace("/mitarbeiter/login");
    }
  }, [status, user, router]);

  if (status === "loading" || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mist-50">
        <div className="flex items-center gap-2 text-sm text-navy-700/60">
          <LockIcon className="h-4 w-4" />
          Prüfe Anmeldung…
        </div>
      </div>
    );
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-white/10 px-5">
        <Logo light />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <Link
          href="/mitarbeiter"
          onClick={() => setMobileOpen(false)}
          className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            pathname === "/mitarbeiter" ? "bg-amber-400 text-navy-950" : "text-white/75 hover:bg-white/10"
          }`}
        >
          Übersicht
        </Link>
        <div className="mt-3 border-t border-white/10 pt-3">
          {employeeModules.map((mod) => {
            const active = pathname === mod.href;
            return (
              <Link
                key={mod.href}
                href={mod.href}
                onClick={() => setMobileOpen(false)}
                className={`mt-1 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? "bg-amber-400 text-navy-950" : "text-white/75 hover:bg-white/10"
                }`}
              >
                <mod.icon className="h-4 w-4 shrink-0" />
                {mod.label}
              </Link>
            );
          })}
        </div>
      </nav>
      <div className="border-t border-white/10 p-4">
        <Link href="/" className="block rounded-lg px-3 py-2 text-xs font-medium text-white/50 hover:text-white/80">
          ← Zur öffentlichen Website
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-mist-50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-navy-950 lg:block">{sidebar}</aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy-950/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-navy-950">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Menü schließen"
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg text-white/70"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
            {sidebar}
          </div>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-navy-900/8 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Menü öffnen"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-navy-900 lg:hidden"
          >
            <MenuIcon className="h-6 w-6" />
          </button>
          <div className="text-sm font-semibold text-navy-900 lg:hidden">Mitarbeiterbereich</div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-semibold text-navy-900">{user.name}</div>
              <div className="text-xs text-navy-700/60">{user.role}</div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-amber-400">
              {user.name
                .split(" ")
                .map((p) => p[0])
                .join("")}
            </div>
            <button
              type="button"
              onClick={() => {
                logout();
                router.replace("/mitarbeiter/login");
              }}
              className="rounded-full border border-navy-900/15 px-3.5 py-1.5 text-xs font-semibold text-navy-800 hover:bg-navy-900/5"
            >
              Abmelden
            </button>
          </div>
        </header>
        <main className="px-4 py-8 sm:px-6 lg:py-10">
          {user.role === "Fahrer" ? <VehicleGate driverName={user.name}>{children}</VehicleGate> : children}
        </main>
      </div>
    </div>
  );
}
