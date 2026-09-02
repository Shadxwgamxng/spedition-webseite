"use client";

import { useMemo, useState } from "react";
import { EmployeePageHeader, StatCard } from "@/components/employee/page-header";
import { Badge } from "@/components/ui/primitives";
import { usePolling } from "@/lib/use-polling";
import type { MaintenanceStatus, VehicleRecord } from "@/lib/fleet-data";

type VehiclesResponse = { vehicles: VehicleRecord[] };

const statusTone: Record<MaintenanceStatus, "green" | "amber" | "navy"> = {
  Einsatzbereit: "green",
  "In Werkstatt": "amber",
  "TÜV fällig": "amber",
};

export default function FahrzeugePage() {
  const { data } = usePolling<VehiclesResponse>("/api/vehicles", 5000);
  const [filter, setFilter] = useState<MaintenanceStatus | "Alle">("Alle");

  const vehicles = useMemo(() => data?.vehicles ?? [], [data]);

  const filtered = useMemo(
    () => (filter === "Alle" ? vehicles : vehicles.filter((v) => v.maintenanceStatus === filter)),
    [vehicles, filter],
  );

  const readyCount = vehicles.filter((v) => v.maintenanceStatus === "Einsatzbereit").length;
  const attentionCount = vehicles.filter((v) => v.maintenanceStatus !== "Einsatzbereit").length;
  const activeCount = vehicles.filter((v) => v.activeDriver).length;

  return (
    <div>
      <EmployeePageHeader
        title="Fahrzeugverwaltung"
        description="Fuhrpark, Laufleistungen sowie Wartungs- und Prüftermine im Überblick."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Fahrzeuge gesamt" value={String(vehicles.length)} />
        <StatCard label="Einsatzbereit" value={String(readyCount)} tone="good" />
        <StatCard label="Werkstatt / TÜV fällig" value={String(attentionCount)} tone={attentionCount ? "warn" : "good"} />
        <StatCard label="Gerade im Einsatz" value={String(activeCount)} hint="Fahrer angemeldet" />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        {(["Alle", "Einsatzbereit", "In Werkstatt", "TÜV fällig"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              filter === s ? "bg-navy-900 text-white" : "bg-white text-navy-700 hover:bg-navy-900/5"
            } border border-navy-900/10`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-navy-900/8 bg-white shadow-sm shadow-navy-950/5">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-navy-900/8 bg-mist-100 text-xs uppercase tracking-wide text-navy-700/60">
            <tr>
              <th className="px-4 py-3 font-medium">Kennzeichen</th>
              <th className="px-4 py-3 font-medium">Typ</th>
              <th className="px-4 py-3 font-medium">Baujahr</th>
              <th className="px-4 py-3 font-medium">Kilometerstand</th>
              <th className="px-4 py-3 font-medium">Nächste Wartung</th>
              <th className="px-4 py-3 font-medium">Nächster TÜV</th>
              <th className="px-4 py-3 font-medium">Aktuell gefahren von</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-900/6">
            {filtered.map((v) => (
              <tr key={v.plate}>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-navy-900">{v.plate}</td>
                <td className="px-4 py-3 text-navy-800">{v.type}</td>
                <td className="px-4 py-3 text-navy-700/70">{v.year}</td>
                <td className="px-4 py-3 text-navy-700/70">{v.mileage.toLocaleString("de-DE")} km</td>
                <td className="whitespace-nowrap px-4 py-3 text-navy-700/70">
                  {new Date(v.nextService).toLocaleDateString("de-DE")}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-navy-700/70">
                  {new Date(v.nextTuv).toLocaleDateString("de-DE")}
                </td>
                <td className="px-4 py-3">
                  {v.activeDriver ? (
                    <Badge tone="green">{v.activeDriver}</Badge>
                  ) : (
                    <span className="text-navy-700/40">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone[v.maintenanceStatus]}>{v.maintenanceStatus}</Badge>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && data ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-navy-700/50">
                  Keine Fahrzeuge in dieser Ansicht.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
