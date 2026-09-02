"use client";

import { useState, type ReactNode } from "react";
import { usePolling } from "@/lib/use-polling";
import type { VehicleRecord } from "@/lib/fleet-data";
import { CheckIcon, TruckIcon } from "@/components/ui/icons";

type VehiclesResponse = { vehicles: VehicleRecord[] };

/**
 * Gates the employee dashboard for the "Fahrer" role: a driver must log into an
 * available vehicle before they can use the rest of the employee area. Once
 * logged in, that assignment is written to the shared server store, so it shows
 * up live on the Disposition board for dispatchers on a different device.
 */
export function VehicleGate({ driverName, children }: { driverName: string; children: ReactNode }) {
  const { data, error, refetch } = usePolling<VehiclesResponse>("/api/vehicles", 4000);
  const [pending, setPending] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const vehicles = data?.vehicles ?? [];
  const myVehicle = vehicles.find((v) => v.activeDriver === driverName) ?? null;

  async function loginToVehicle(plate: string) {
    setPending(plate);
    setActionError(null);
    try {
      const res = await fetch("/api/vehicles/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plate, driverName }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setActionError(json.error ?? "Anmeldung am Fahrzeug fehlgeschlagen.");
        return;
      }
      await refetch();
    } catch {
      setActionError("Verbindung zum Server fehlgeschlagen.");
    } finally {
      setPending(null);
    }
  }

  async function logoutOfVehicle() {
    setPending(myVehicle?.plate ?? "logout");
    setActionError(null);
    try {
      await fetch("/api/vehicles/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverName }),
      });
      await refetch();
    } finally {
      setPending(null);
    }
  }

  if (myVehicle) {
    return (
      <div>
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900 text-amber-400">
              <TruckIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-navy-900">
                Angemeldet auf {myVehicle.plate} · {myVehicle.type}
              </div>
              <div className="text-xs text-navy-700/60">
                Sichtbar für die Disposition
                {myVehicle.activeSince
                  ? ` seit ${new Date(myVehicle.activeSince).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr`
                  : ""}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={logoutOfVehicle}
            disabled={pending !== null}
            className="rounded-full border border-navy-900/15 px-4 py-2 text-xs font-semibold text-navy-800 hover:bg-white disabled:opacity-50"
          >
            Fahrzeug abmelden
          </button>
        </div>
        {children}
      </div>
    );
  }

  const available = vehicles.filter((v) => !v.activeDriver && v.maintenanceStatus === "Einsatzbereit");
  const unavailable = vehicles.filter((v) => v.activeDriver || v.maintenanceStatus !== "Einsatzbereit");

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-900 text-amber-400">
          <TruckIcon className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-navy-900">Bitte auf ein Fahrzeug anmelden</h1>
        <p className="mt-2 text-sm text-navy-700/70">
          Wähle dein Fahrzeug für heute aus. Die Disposition sieht deine Anmeldung sofort und kann dir Aufträge
          zuweisen.
        </p>
      </div>

      {error ? (
        <p className="mb-4 text-center text-sm text-red-600">Fahrzeugliste konnte nicht geladen werden.</p>
      ) : null}
      {actionError ? <p className="mb-4 text-center text-sm text-red-600">{actionError}</p> : null}

      {!data ? (
        <p className="text-center text-sm text-navy-700/60">Fahrzeuge werden geladen…</p>
      ) : (
        <div className="space-y-3">
          {available.map((v) => (
            <div
              key={v.plate}
              className="flex items-center justify-between gap-4 rounded-2xl border border-navy-900/8 bg-white p-4 shadow-sm shadow-navy-950/5"
            >
              <div>
                <div className="font-mono text-sm font-semibold text-navy-900">{v.plate}</div>
                <div className="text-xs text-navy-700/60">{v.type}</div>
              </div>
              <button
                type="button"
                onClick={() => loginToVehicle(v.plate)}
                disabled={pending !== null}
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-navy-950 hover:bg-amber-400 disabled:opacity-50"
              >
                <CheckIcon className="h-3.5 w-3.5" />
                {pending === v.plate ? "Meldet an…" : "Einloggen"}
              </button>
            </div>
          ))}
          {available.length === 0 ? (
            <p className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4 text-center text-sm text-navy-700/70">
              Aktuell ist kein Fahrzeug frei verfügbar. Bitte mit der Disposition abstimmen.
            </p>
          ) : null}

          {unavailable.length > 0 ? (
            <div className="pt-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-700/50">
                Belegt / nicht verfügbar
              </div>
              <div className="space-y-2">
                {unavailable.map((v) => (
                  <div
                    key={v.plate}
                    className="flex items-center justify-between rounded-xl border border-navy-900/8 bg-mist-100 px-4 py-2.5 text-sm text-navy-700/60"
                  >
                    <span className="font-mono">{v.plate}</span>
                    <span>{v.activeDriver ? `bei ${v.activeDriver}` : v.maintenanceStatus}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
