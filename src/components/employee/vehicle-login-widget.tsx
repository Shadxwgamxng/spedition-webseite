"use client";

import { useState } from "react";
import { usePolling } from "@/lib/use-polling";
import type { VehicleRecord } from "@/lib/fleet-data";
import { CheckIcon, TruckIcon } from "@/components/ui/icons";

type VehiclesResponse = { vehicles: VehicleRecord[] };

const UNSELECTED = "";

/**
 * Optional, non-blocking vehicle login for every role that isn't "Fahrer"
 * (that role gets the mandatory full-page VehicleGate instead). Lets e.g.
 * Geschäftsführung or ein Betriebsleiter temporarily act as a driver — once
 * logged in, they show up on the Disposition board like any other active
 * vehicle/driver and can be assigned orders, without losing access to the
 * rest of the Mitarbeiterbereich in the meantime.
 */
export function VehicleLoginWidget({ driverName }: { driverName: string }) {
  const { data, refetch } = usePolling<VehiclesResponse>("/api/vehicles", 5000);
  const [selected, setSelected] = useState(UNSELECTED);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vehicles = data?.vehicles ?? [];
  const myVehicle = vehicles.find((v) => v.activeDriver === driverName) ?? null;
  const available = vehicles.filter((v) => !v.activeDriver && v.maintenanceStatus === "Einsatzbereit");

  async function login() {
    if (!selected) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/vehicles/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plate: selected, driverName }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Anmeldung am Fahrzeug fehlgeschlagen.");
        return;
      }
      setSelected(UNSELECTED);
      await refetch();
    } catch {
      setError("Verbindung zum Server fehlgeschlagen.");
    } finally {
      setPending(false);
    }
  }

  async function logout() {
    setPending(true);
    setError(null);
    try {
      await fetch("/api/vehicles/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverName }),
      });
      await refetch();
    } finally {
      setPending(false);
    }
  }

  if (!data) return null;

  return (
    <div className="mb-8 rounded-2xl border border-navy-900/8 bg-white p-4 shadow-sm shadow-navy-950/5">
      {myVehicle ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900 text-amber-400">
              <TruckIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-navy-900">
                Als Fahrer aktiv auf {myVehicle.plate} · {myVehicle.type}
              </div>
              <div className="text-xs text-navy-700/60">Sichtbar für die Disposition, kannst dir Aufträge zuweisen lassen.</div>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            disabled={pending}
            className="rounded-full border border-navy-900/15 px-4 py-2 text-xs font-semibold text-navy-800 hover:bg-mist-100 disabled:opacity-50"
          >
            Fahrzeug abmelden
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mist-100 text-navy-700">
              <TruckIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-navy-900">Als Fahrer einsetzen</div>
              <div className="text-xs text-navy-700/60">
                Optional: auf ein Fahrzeug anmelden, um selbst eine Tour zu übernehmen.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-xs"
            >
              <option value={UNSELECTED}>Fahrzeug wählen…</option>
              {available.map((v) => (
                <option key={v.plate} value={v.plate}>
                  {v.plate} · {v.type}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={login}
              disabled={!selected || pending}
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-navy-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckIcon className="h-3.5 w-3.5" />
              {pending ? "Meldet an…" : "Einloggen"}
            </button>
          </div>
        </div>
      )}
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
      {!myVehicle && available.length === 0 ? (
        <p className="mt-2 text-xs text-navy-700/50">Aktuell ist kein Fahrzeug frei verfügbar.</p>
      ) : null}
    </div>
  );
}
