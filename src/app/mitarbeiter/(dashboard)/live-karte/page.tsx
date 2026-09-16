"use client";

import { useState } from "react";
import { EmployeePageHeader } from "@/components/employee/page-header";
import { Badge } from "@/components/ui/primitives";
import { usePolling } from "@/lib/use-polling";
import type { DriverPositionRecord } from "@/lib/server/db-types";

type LiveMapResponse = { drivers: DriverPositionRecord[] };

/**
 * Grobe, community-übliche Weltkoordinaten-Extents der vollständigen
 * GTA-V-Karte - identisch zu MAP_BOUNDS im Tablet-Repo
 * (speditions-tablet/html/js/app.js), damit ein Fahrer auf beiden Karten an
 * derselben relativen Stelle erscheint. Passt der eigene Kartenausschnitt
 * (public/gta-map.jpg) nicht exakt dazu, hier nachjustieren.
 */
const MAP_BOUNDS = { minX: -4300, maxX: 4700, minY: -4300, maxY: 8200 };

function worldToPercent(x: number, y: number): [number, number] {
  const px = ((x - MAP_BOUNDS.minX) / (MAP_BOUNDS.maxX - MAP_BOUNDS.minX)) * 100;
  const py = 100 - ((y - MAP_BOUNDS.minY) / (MAP_BOUNDS.maxY - MAP_BOUNDS.minY)) * 100; // Y invertiert: Norden (GTA Y+) = oben
  return [px, py];
}

const orderStatusLabels: Record<string, string> = {
  angenommen: "Angenommen",
  anfahrt: "Anfahrt zum Beladepunkt",
  beladen: "Beladen, unterwegs zum Ziel",
  entladen: "Wird entladen",
};

export default function LiveKartePage() {
  const { data } = usePolling<LiveMapResponse>("/api/live-map", 3000);
  const [imgMissing, setImgMissing] = useState(false);
  const drivers = data?.drivers ?? [];

  return (
    <div>
      <EmployeePageHeader
        title="Live-Karte"
        description="Zeigt ausschließlich gerade eingestempelte Fahrer in Echtzeit - Position, Fahrzeug und aktiver Lieferauftrag."
      />

      <div className="relative overflow-hidden rounded-2xl border border-navy-900/8 bg-navy-950 shadow-sm shadow-navy-950/5">
        {imgMissing ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-2 px-6 py-16 text-center text-sm text-white/60">
            <p>Kein Kartenbild gefunden.</p>
            <p className="max-w-md text-xs text-white/40">
              Lege eine Kartengrafik der GTA-V-Spielwelt als <code className="text-white/60">public/gta-map.jpg</code> ab
              (siehe README &bdquo;Live-Karte&ldquo;) - diese Ressource liefert sie aus Lizenzgründen nicht mit.
            </p>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- Kartenbild ist ein vom Betreiber selbst hinzugefügtes, dynamisches Asset, keine feste Projekt-Grafik.
          <img
            src="/gta-map.jpg"
            alt="Karte"
            className="block w-full"
            onError={() => setImgMissing(true)}
          />
        )}
        <div className="pointer-events-none absolute inset-0">
          {drivers.map((drv) => {
            const [left, top] = worldToPercent(drv.x, drv.y);
            return (
              <div
                key={drv.tabletEmployeeId}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
                style={{ left: `${left}%`, top: `${top}%` }}
                title={drv.name}
              >
                <div className="h-3.5 w-3.5 rounded-full border-2 border-navy-950 bg-amber-400 shadow" />
                <div className="whitespace-nowrap rounded bg-navy-950/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {drv.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 space-y-2">
        {drivers.length === 0 ? (
          <p className="rounded-2xl border border-navy-900/8 bg-white p-6 text-sm text-navy-700/60">
            Aktuell ist niemand eingestempelt.
          </p>
        ) : (
          drivers.map((drv) => (
            <div
              key={drv.tabletEmployeeId}
              className="flex flex-col gap-1 rounded-xl border border-navy-900/8 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold text-navy-900">{drv.name}</div>
                <div className="text-xs text-navy-700/60">
                  {drv.vehicleLabel || drv.vehiclePlate
                    ? `${drv.vehicleLabel ?? "Fahrzeug"}${drv.vehiclePlate ? ` · ${drv.vehiclePlate}` : ""}`
                    : "Kein Fahrzeug erkannt"}
                </div>
                {drv.order ? (
                  <div className="mt-1 text-xs text-navy-700/60">
                    {drv.order.cargo}: {drv.order.startLocation} → {drv.order.endLocation}
                  </div>
                ) : (
                  <div className="mt-1 text-xs text-navy-700/40">Kein laufender Auftrag</div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {drv.order ? <Badge tone="amber">{orderStatusLabels[drv.order.status] ?? drv.order.status}</Badge> : null}
                <span className="font-mono text-xs text-navy-700/50">
                  {drv.x.toFixed(0)}, {drv.y.toFixed(0)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
