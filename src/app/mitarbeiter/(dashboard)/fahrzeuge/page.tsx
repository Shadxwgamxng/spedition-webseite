"use client";

import { useMemo, useState } from "react";
import { EmployeePageHeader, StatCard } from "@/components/employee/page-header";
import { Badge } from "@/components/ui/primitives";

type VehicleStatus = "Einsatzbereit" | "Unterwegs" | "In Werkstatt" | "TÜV fällig";

type Vehicle = {
  plate: string;
  type: string;
  year: number;
  mileage: number;
  nextService: string;
  nextTuv: string;
  status: VehicleStatus;
};

const statusTone: Record<VehicleStatus, "green" | "amber" | "navy"> = {
  Einsatzbereit: "green",
  Unterwegs: "navy",
  "In Werkstatt": "amber",
  "TÜV fällig": "amber",
};

const initialVehicles: Vehicle[] = [
  { plate: "SN-BF 101", type: "Sattelzugmaschine Euro 6", year: 2024, mileage: 128450, nextService: "2026-10-02", nextTuv: "2027-03-15", status: "Unterwegs" },
  { plate: "SN-BF 102", type: "Sattelzugmaschine Euro 6", year: 2023, mileage: 189320, nextService: "2026-09-18", nextTuv: "2026-11-30", status: "Einsatzbereit" },
  { plate: "SN-BF 104", type: "Sattelzugmaschine Euro 6E", year: 2025, mileage: 42110, nextService: "2027-01-20", nextTuv: "2027-06-10", status: "Unterwegs" },
  { plate: "SN-BF 112", type: "Kühlauflieger Multi-Temp", year: 2022, mileage: 210870, nextService: "2026-09-10", nextTuv: "2026-09-25", status: "TÜV fällig" },
  { plate: "SN-BF 118", type: "Standard-Sattelauflieger", year: 2021, mileage: 265400, nextService: "2026-09-05", nextTuv: "2027-02-18", status: "In Werkstatt" },
  { plate: "SN-BF 122", type: "Wechselbrücke 7,5t", year: 2023, mileage: 98230, nextService: "2026-11-12", nextTuv: "2027-04-02", status: "Einsatzbereit" },
];

export default function FahrzeugePage() {
  const [vehicles] = useState<Vehicle[]>(initialVehicles);
  const [filter, setFilter] = useState<VehicleStatus | "Alle">("Alle");

  const filtered = useMemo(
    () => (filter === "Alle" ? vehicles : vehicles.filter((v) => v.status === filter)),
    [vehicles, filter],
  );

  const readyCount = vehicles.filter((v) => v.status === "Einsatzbereit" || v.status === "Unterwegs").length;
  const attentionCount = vehicles.filter((v) => v.status === "In Werkstatt" || v.status === "TÜV fällig").length;

  return (
    <div>
      <EmployeePageHeader
        title="Fahrzeugverwaltung"
        description="Fuhrpark, Laufleistungen sowie Wartungs- und Prüftermine im Überblick."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Fahrzeuge gesamt" value={String(vehicles.length)} hint="Demo-Auswahl aus 119 Fahrzeugen" />
        <StatCard label="Einsatzbereit / unterwegs" value={String(readyCount)} tone="good" />
        <StatCard label="Werkstatt / TÜV fällig" value={String(attentionCount)} tone={attentionCount ? "warn" : "good"} />
        <StatCard label="Ø Laufleistung" value={`${Math.round(vehicles.reduce((s, v) => s + v.mileage, 0) / vehicles.length).toLocaleString("de-DE")} km`} />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        {(["Alle", "Einsatzbereit", "Unterwegs", "In Werkstatt", "TÜV fällig"] as const).map((s) => (
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
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-navy-900/8 bg-mist-100 text-xs uppercase tracking-wide text-navy-700/60">
            <tr>
              <th className="px-4 py-3 font-medium">Kennzeichen</th>
              <th className="px-4 py-3 font-medium">Typ</th>
              <th className="px-4 py-3 font-medium">Baujahr</th>
              <th className="px-4 py-3 font-medium">Kilometerstand</th>
              <th className="px-4 py-3 font-medium">Nächste Wartung</th>
              <th className="px-4 py-3 font-medium">Nächster TÜV</th>
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
                  <Badge tone={statusTone[v.status]}>{v.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
