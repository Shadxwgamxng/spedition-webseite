"use client";

import { useMemo, useState } from "react";
import { EmployeePageHeader, StatCard } from "@/components/employee/page-header";
import { Badge } from "@/components/ui/primitives";
import { usePolling } from "@/lib/use-polling";
import { useAuth } from "@/lib/auth";

type InvoiceStatus = "Offen" | "Bezahlt" | "Überfällig";
type Invoice = { number: string; customer: string; date: string; total: number; status: InvoiceStatus };

type TabletTransactionType = "einnahme" | "auszahlung" | "einzahlung" | "gehalt";
type TabletTransaction = {
  id: number;
  type: TabletTransactionType;
  amount: number;
  description: string;
  driverName: string | null;
  createdByName: string | null;
  createdAt: string;
};

const statusTone: Record<InvoiceStatus, "amber" | "green" | "navy"> = {
  Offen: "amber",
  Bezahlt: "green",
  Überfällig: "navy",
};

const TX_TYPE_LABEL: Record<TabletTransactionType, string> = {
  einnahme: "Einnahme (Auftrag)",
  auszahlung: "Auszahlung",
  einzahlung: "Einzahlung",
  gehalt: "Gehalt",
};

const TX_TYPE_TONE: Record<TabletTransactionType, "amber" | "green" | "navy"> = {
  einnahme: "green",
  auszahlung: "amber",
  einzahlung: "navy",
  gehalt: "amber",
};

function startOfIsoWeek(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

function startOfMonth(d: Date): Date {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function FinanzenPage() {
  const { user } = useAuth();
  const canResetTabletFinance = user?.roleKey === "geschaeftsfuehrung" || user?.roleKey === "prokurist";
  const [resetting, setResetting] = useState(false);

  const { data } = usePolling<{ invoices: Invoice[] }>("/api/invoices", 5000);
  const invoices = useMemo(() => data?.invoices ?? [], [data]);

  const { data: tabletData, refetch: refetchTabletData } = usePolling<{
    balance: number;
    transactions: TabletTransaction[];
  }>("/api/finance/tablet", 5000);
  const tabletBalance = tabletData?.balance ?? 0;
  const tabletTransactions = useMemo(() => tabletData?.transactions ?? [], [tabletData]);

  async function resetTabletFinance() {
    if (
      !window.confirm(
        "Ingame-Umsatz wirklich komplett zurücksetzen? Löscht alle bisher vom Tablet übertragenen Buchungen und setzt den Saldo auf € 0 — z. B. nach einem Serverumzug mit neuer Tablet-Datenbank. Die Rechnungen oben sind davon nicht betroffen.",
      )
    ) {
      return;
    }
    setResetting(true);
    try {
      await fetch("/api/finance/tablet", { method: "DELETE" });
      await refetchTabletData();
    } finally {
      setResetting(false);
    }
  }

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

  const { revenueWeek, revenueMonth } = useMemo(() => {
    const now = new Date();
    const weekStart = startOfIsoWeek(now).getTime();
    const monthStart = startOfMonth(now).getTime();
    let revenueWeek = 0;
    let revenueMonth = 0;
    for (const tx of tabletTransactions) {
      if (tx.type !== "einnahme") continue;
      const at = new Date(tx.createdAt).getTime();
      if (at >= weekStart) revenueWeek += tx.amount;
      if (at >= monthStart) revenueMonth += tx.amount;
    }
    return { revenueWeek, revenueMonth };
  }, [tabletTransactions]);

  const currentMonth = new Date().toLocaleDateString("de-DE", { month: "long", year: "numeric" });

  return (
    <div>
      <EmployeePageHeader
        title="Finanzbuchhaltung"
        description={`Übersicht der Rechnungen, offenen Forderungen und des Ingame-Firmenkontos – Stand ${currentMonth}.`}
      />

      <p className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-xs text-navy-700/70">
        Rechnungen unten basieren auf den unter &bdquo;Rechnungserstellung&ldquo; erstellten Rechnungen. Der
        &bdquo;Ingame-Umsatz&ldquo;-Abschnitt darunter spiegelt live das Firmenkonto des FiveM Speditions-Tablets
        (Aufträge, Aus-/Einzahlungen, Gehälter) — beide Quellen sind unabhängig voneinander und werden nicht
        automatisch gegeneinander verrechnet.
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

      <div className="mb-3 mt-10 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-700/60">
          Ingame-Umsatz (Tablet-Firmenkonto)
        </h2>
        {canResetTabletFinance && tabletTransactions.length > 0 ? (
          <button
            type="button"
            onClick={resetTabletFinance}
            disabled={resetting}
            className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            {resetting ? "Wird zurückgesetzt…" : "Ingame-Umsatz zurücksetzen"}
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Firmenkonto-Saldo" value={`€ ${tabletBalance.toLocaleString("de-DE", { minimumFractionDigits: 2 })}`} tone="good" />
        <StatCard label="Einnahmen diese Woche" value={`€ ${revenueWeek.toLocaleString("de-DE", { minimumFractionDigits: 2 })}`} />
        <StatCard label="Einnahmen diesen Monat" value={`€ ${revenueMonth.toLocaleString("de-DE", { minimumFractionDigits: 2 })}`} />
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-navy-900/8 bg-white shadow-sm shadow-navy-950/5">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-navy-900/8 bg-mist-100 text-xs uppercase tracking-wide text-navy-700/60">
            <tr>
              <th className="px-4 py-3 font-medium">Datum</th>
              <th className="px-4 py-3 font-medium">Typ</th>
              <th className="px-4 py-3 font-medium">Beschreibung</th>
              <th className="px-4 py-3 font-medium">Fahrer / Ausgeführt von</th>
              <th className="px-4 py-3 font-medium">Betrag</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-900/6">
            {tabletTransactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-navy-700/60">
                  Noch keine Buchungen vom Tablet empfangen — entweder ist der Website-Sync im Tablet
                  (Config.Website.enabled) noch nicht aktiv, oder es gab bisher noch keine Firmenkonto-Bewegung.
                </td>
              </tr>
            ) : (
              tabletTransactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-navy-700/70">
                    {new Date(tx.createdAt).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={TX_TYPE_TONE[tx.type]}>{TX_TYPE_LABEL[tx.type]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-navy-800">{tx.description || "-"}</td>
                  <td className="px-4 py-3 text-navy-700/70">{tx.driverName ?? tx.createdByName ?? "-"}</td>
                  <td className={`px-4 py-3 font-medium ${tx.amount >= 0 ? "text-green-700" : "text-navy-900"}`}>
                    {tx.amount >= 0 ? "+" : ""}
                    {"€ "}
                    {tx.amount.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
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
