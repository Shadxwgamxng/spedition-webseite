"use client";

import { useMemo } from "react";
import { EmployeePageHeader, StatCard } from "@/components/employee/page-header";
import { Badge } from "@/components/ui/primitives";
import { usePolling } from "@/lib/use-polling";

type InvoiceStatus = "Offen" | "Bezahlt" | "Überfällig";
type Invoice = { number: string; customer: string; date: string; total: number; status: InvoiceStatus };

const statusTone: Record<InvoiceStatus, "amber" | "green" | "navy"> = {
  Offen: "amber",
  Bezahlt: "green",
  Überfällig: "navy",
};

export default function FinanzenPage() {
  const { data } = usePolling<{ invoices: Invoice[] }>("/api/invoices", 5000);
  const invoices = useMemo(() => data?.invoices ?? [], [data]);

  const { openTotal, paidTotal, overdueCount } = useMemo(() => {
    let openTotal = 0;
    let paidTotal = 0;
    let overdueCount = 0;
    for (const inv of invoices) {
      if (inv.status === "Bezahlt") paidTotal += inv.total;
      else openTotal += inv.total;
      if (inv.status === "Überfällig") overdueCount += 1;
    }
    return { openTotal, paidTotal, overdueCount };
  }, [invoices]);

  const currentMonth = new Date().toLocaleDateString("de-DE", { month: "long", year: "numeric" });

  return (
    <div>
      <EmployeePageHeader
        title="Finanzbuchhaltung"
        description={`Übersicht der Rechnungen und offenen Forderungen – Stand ${currentMonth}.`}
      />

      <p className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-xs text-navy-700/70">
        Diese Übersicht basiert ausschließlich auf den unter &bdquo;Rechnungserstellung&ldquo; erstellten Rechnungen (Erlösseite).
        Eine Ausgaben-/Kassenbuchhaltung (Kraftstoff, Personal, Werkstatt u. Ä.) ist aktuell nicht angebunden.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Rechnungen gesamt" value={String(invoices.length)} />
        <StatCard label="Offene Forderungen" value={`€ ${openTotal.toLocaleString("de-DE", { minimumFractionDigits: 2 })}`} tone={openTotal > 0 ? "warn" : "good"} />
        <StatCard label="Bezahlt gesamt" value={`€ ${paidTotal.toLocaleString("de-DE", { minimumFractionDigits: 2 })}`} tone="good" />
        <StatCard label="Überfällige Rechnungen" value={String(overdueCount)} tone={overdueCount ? "warn" : "good"} />
      </div>

      <h2 className="mb-3 mt-10 text-sm font-semibold uppercase tracking-wide text-navy-700/60">Rechnungen (Erlöse)</h2>
      <div className="overflow-x-auto rounded-2xl border border-navy-900/8 bg-white shadow-sm shadow-navy-950/5">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-navy-900/8 bg-mist-100 text-xs uppercase tracking-wide text-navy-700/60">
            <tr>
              <th className="px-4 py-3 font-medium">Datum</th>
              <th className="px-4 py-3 font-medium">Rechnung</th>
              <th className="px-4 py-3 font-medium">Kunde</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Betrag</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-900/6">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-navy-700/60">
                  Noch keine Rechnungen erstellt.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.number}>
                  <td className="whitespace-nowrap px-4 py-3 text-navy-700/70">
                    {new Date(inv.date).toLocaleDateString("de-DE")}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-navy-700/70">{inv.number}</td>
                  <td className="px-4 py-3 text-navy-800">{inv.customer}</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone[inv.status]}>{inv.status}</Badge>
                  </td>
                  <td className="px-4 py-3 font-medium text-navy-900">
                    + € {inv.total.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
