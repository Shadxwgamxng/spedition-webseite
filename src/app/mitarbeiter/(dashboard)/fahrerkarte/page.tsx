"use client";

import { useState } from "react";
import { EmployeePageHeader, StatCard } from "@/components/employee/page-header";
import { Badge } from "@/components/ui/primitives";

type DriverCard = {
  driver: string;
  cardNumber: string;
  drivingToday: number;
  drivingWeek: number;
  breakRemaining: number;
  restStatus: "Ausreichend" | "Pause fällig" | "Ruhezeit aktiv";
};

const maxDaily = 9;
const maxWeekly = 56;

const initialCards: DriverCard[] = [
  { driver: "Lukas Schmidt", cardNumber: "DE-1004-7781", drivingToday: 6.5, drivingWeek: 38, breakRemaining: 15, restStatus: "Pause fällig" },
  { driver: "Piotr Nowak", cardNumber: "PL-2231-0094", drivingToday: 4.2, drivingWeek: 29, breakRemaining: 165, restStatus: "Ausreichend" },
  { driver: "Timo Fischer", cardNumber: "DE-1004-6620", drivingToday: 0, drivingWeek: 44, breakRemaining: 0, restStatus: "Ruhezeit aktiv" },
  { driver: "Anja Krüger", cardNumber: "DE-1004-9012", drivingToday: 7.8, drivingWeek: 41, breakRemaining: 25, restStatus: "Pause fällig" },
  { driver: "Rafael Lindt", cardNumber: "DE-1004-5543", drivingToday: 3.1, drivingWeek: 22, breakRemaining: 210, restStatus: "Ausreichend" },
];

const statusTone: Record<DriverCard["restStatus"], "green" | "amber" | "navy"> = {
  Ausreichend: "green",
  "Pause fällig": "amber",
  "Ruhezeit aktiv": "navy",
};

export default function FahrerkartePage() {
  const [cards] = useState<DriverCard[]>(initialCards);
  const attentionCount = cards.filter((c) => c.restStatus !== "Ausreichend").length;

  return (
    <div>
      <EmployeePageHeader
        title="Digitale Fahrerkarte"
        description="Lenk- und Ruhezeiten aller Fahrer in Echtzeit im Blick behalten."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Aktive Fahrerkarten" value={String(cards.length)} />
        <StatCard label="Pause / Ruhezeit fällig" value={String(attentionCount)} tone={attentionCount ? "warn" : "good"} />
        <StatCard label="Max. Lenkzeit / Tag" value={`${maxDaily} h`} hint="gesetzlicher Rahmen" />
        <StatCard label="Max. Lenkzeit / Woche" value={`${maxWeekly} h`} hint="gesetzlicher Rahmen" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {cards.map((card) => {
          const dailyPct = Math.min(100, (card.drivingToday / maxDaily) * 100);
          const weeklyPct = Math.min(100, (card.drivingWeek / maxWeekly) * 100);
          return (
            <div key={card.driver} className="rounded-2xl border border-navy-900/8 bg-white p-5 shadow-sm shadow-navy-950/5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-navy-900">{card.driver}</div>
                  <div className="font-mono text-xs text-navy-700/50">{card.cardNumber}</div>
                </div>
                <Badge tone={statusTone[card.restStatus]}>{card.restStatus}</Badge>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-navy-700/60">
                    <span>Lenkzeit heute</span>
                    <span>{card.drivingToday} h / {maxDaily} h</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-navy-900/8">
                    <div
                      className={`h-full rounded-full ${dailyPct > 85 ? "bg-amber-500" : "bg-navy-700"}`}
                      style={{ width: `${dailyPct}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-navy-700/60">
                    <span>Lenkzeit diese Woche</span>
                    <span>{card.drivingWeek} h / {maxWeekly} h</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-navy-900/8">
                    <div
                      className={`h-full rounded-full ${weeklyPct > 85 ? "bg-amber-500" : "bg-navy-700"}`}
                      style={{ width: `${weeklyPct}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 text-xs text-navy-700/60">
                Verbleibende Pause/Ruhezeit: <span className="font-semibold text-navy-800">{card.breakRemaining} min</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
