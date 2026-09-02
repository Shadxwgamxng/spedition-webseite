"use client";

import { useState } from "react";
import { EmployeePageHeader, StatCard } from "@/components/employee/page-header";
import { Badge } from "@/components/ui/primitives";

type Booking = {
  date: string;
  reference: string;
  category: string;
  type: "Soll" | "Haben";
  amount: number;
};

const bookings: Booking[] = [
  { date: "2026-09-01", reference: "RE-2026-0341", category: "Erlöse Transport", type: "Haben", amount: 2380.5 },
  { date: "2026-08-31", reference: "ER-2026-0912", category: "Kraftstoff", type: "Soll", amount: 6120.4 },
  { date: "2026-08-30", reference: "RE-2026-0340", category: "Erlöse Transport", type: "Haben", amount: 4120.0 },
  { date: "2026-08-29", reference: "ER-2026-0908", category: "Werkstatt & Wartung", type: "Soll", amount: 1840.0 },
  { date: "2026-08-28", reference: "LN-2026-0044", category: "Personal", type: "Soll", amount: 58200.0 },
  { date: "2026-08-27", reference: "RE-2026-0339", category: "Erlöse Lagerlogistik", type: "Haben", amount: 980.75 },
];

const categories = [
  { label: "Umsatz Transport", value: "€ 412.800", tone: "good" as const },
  { label: "Umsatz Lagerlogistik", value: "€ 96.400", tone: "good" as const },
  { label: "Betriebskosten", value: "€ 318.250", tone: "warn" as const },
  { label: "Personalkosten", value: "€ 210.100", tone: "warn" as const },
];

export default function FinanzenPage() {
  const [monthFilter] = useState("August 2026");
  const openReceivables = 84320;
  const openPayables = 27650;
  const liquidity = 156_940;

  return (
    <div>
      <EmployeePageHeader
        title="Finanzbuchhaltung"
        description={`Übersicht der Buchungen, offenen Posten und wichtigsten Kennzahlen – Berichtsmonat ${monthFilter}.`}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Offene Forderungen" value={`€ ${openReceivables.toLocaleString("de-DE")}`} tone="warn" />
        <StatCard label="Offene Verbindlichkeiten" value={`€ ${openPayables.toLocaleString("de-DE")}`} tone="warn" />
        <StatCard label="Liquide Mittel" value={`€ ${liquidity.toLocaleString("de-DE")}`} tone="good" />
        <StatCard label="Berichtsmonat" value={monthFilter} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((c) => (
          <div key={c.label} className="rounded-2xl border border-navy-900/8 bg-white p-5 shadow-sm shadow-navy-950/5">
            <div className="text-xs font-medium uppercase tracking-wide text-navy-700/50">{c.label}</div>
            <div className={`mt-2 text-xl font-bold ${c.tone === "good" ? "text-emerald-600" : "text-amber-600"}`}>
              {c.value}
            </div>
          </div>
        ))}
      </div>

      <h2 className="mb-3 mt-10 text-sm font-semibold uppercase tracking-wide text-navy-700/60">Letzte Buchungen</h2>
      <div className="overflow-x-auto rounded-2xl border border-navy-900/8 bg-white shadow-sm shadow-navy-950/5">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-navy-900/8 bg-mist-100 text-xs uppercase tracking-wide text-navy-700/60">
            <tr>
              <th className="px-4 py-3 font-medium">Datum</th>
              <th className="px-4 py-3 font-medium">Beleg</th>
              <th className="px-4 py-3 font-medium">Kategorie</th>
              <th className="px-4 py-3 font-medium">Art</th>
              <th className="px-4 py-3 font-medium">Betrag</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-900/6">
            {bookings.map((b) => (
              <tr key={b.reference}>
                <td className="whitespace-nowrap px-4 py-3 text-navy-700/70">{new Date(b.date).toLocaleDateString("de-DE")}</td>
                <td className="px-4 py-3 font-mono text-xs text-navy-700/70">{b.reference}</td>
                <td className="px-4 py-3 text-navy-800">{b.category}</td>
                <td className="px-4 py-3">
                  <Badge tone={b.type === "Haben" ? "green" : "amber"}>{b.type}</Badge>
                </td>
                <td className="px-4 py-3 font-medium text-navy-900">
                  {b.type === "Haben" ? "+" : "−"} € {b.amount.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
