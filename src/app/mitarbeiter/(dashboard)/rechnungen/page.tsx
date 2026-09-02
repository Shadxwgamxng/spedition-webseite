"use client";

import { useMemo, useState } from "react";
import { EmployeePageHeader, StatCard } from "@/components/employee/page-header";
import { Badge, Button } from "@/components/ui/primitives";

type LineItem = { description: string; qty: number; price: number };
type InvoiceStatus = "Offen" | "Bezahlt" | "Überfällig";

type Invoice = {
  number: string;
  customer: string;
  date: string;
  total: number;
  status: InvoiceStatus;
};

const statusTone: Record<InvoiceStatus, "amber" | "green" | "navy"> = {
  Offen: "amber",
  Bezahlt: "green",
  Überfällig: "navy",
};

const initialInvoices: Invoice[] = [
  { number: "RE-2026-0341", customer: "Rathke Baustoffe GmbH", date: "2026-08-28", total: 2380.5, status: "Offen" },
  { number: "RE-2026-0340", customer: "Nordbalt Trading Sp. z o.o.", date: "2026-08-25", total: 4120.0, status: "Bezahlt" },
  { number: "RE-2026-0339", customer: "Küstenlogistik Nord", date: "2026-08-20", total: 980.75, status: "Bezahlt" },
  { number: "RE-2026-0338", customer: "Berndt Frischwaren", date: "2026-08-10", total: 1560.0, status: "Überfällig" },
];

const emptyItem: LineItem = { description: "", qty: 1, price: 0 };

export default function RechnungenPage() {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [customer, setCustomer] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ ...emptyItem }]);
  const [lastCreated, setLastCreated] = useState<Invoice | null>(null);

  const netTotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const vat = netTotal * 0.19;
  const grossTotal = netTotal + vat;

  const openTotal = useMemo(
    () => invoices.filter((i) => i.status !== "Bezahlt").reduce((sum, i) => sum + i.total, 0),
    [invoices],
  );

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addItem() {
    setItems((prev) => [...prev, { ...emptyItem }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function createInvoice() {
    if (!customer || netTotal <= 0) return;
    const number = `RE-2026-${(342 + invoices.length).toString().padStart(4, "0")}`;
    const invoice: Invoice = {
      number,
      customer,
      date: new Date().toISOString().slice(0, 10),
      total: grossTotal,
      status: "Offen",
    };
    setInvoices((prev) => [invoice, ...prev]);
    setLastCreated(invoice);
    setCustomer("");
    setItems([{ ...emptyItem }]);
  }

  return (
    <div>
      <EmployeePageHeader
        title="Rechnungserstellung"
        description="Rechnungen direkt im System erstellen, Positionen kalkulieren und den Zahlungsstatus verwalten."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Rechnungen gesamt" value={String(invoices.length)} />
        <StatCard label="Offene Forderungen" value={`€ ${openTotal.toLocaleString("de-DE", { minimumFractionDigits: 2 })}`} tone="warn" />
        <StatCard label="Bezahlt (Auswahl)" value={String(invoices.filter((i) => i.status === "Bezahlt").length)} tone="good" />
        <StatCard label="Überfällig" value={String(invoices.filter((i) => i.status === "Überfällig").length)} tone="warn" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-2xl border border-navy-900/8 bg-white p-6 shadow-sm shadow-navy-950/5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-600">Neue Rechnung</h2>

          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-medium text-navy-800" htmlFor="customer">
              Kunde
            </label>
            <input
              id="customer"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="z. B. Rathke Baustoffe GmbH"
              className="w-full rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="mt-5 space-y-3">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2">
                <input
                  value={item.description}
                  onChange={(e) => updateItem(index, { description: e.target.value })}
                  placeholder="Position, z. B. Transport Falkenwalde – Berlin"
                  className="col-span-6 rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
                <input
                  type="number"
                  min={0}
                  value={item.qty}
                  onChange={(e) => updateItem(index, { qty: Number(e.target.value) })}
                  placeholder="Menge"
                  className="col-span-2 rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={item.price}
                  onChange={(e) => updateItem(index, { price: Number(e.target.value) })}
                  placeholder="Preis €"
                  className="col-span-3 rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                  className="col-span-1 rounded-lg text-navy-700/40 hover:text-red-600 disabled:opacity-30"
                  aria-label="Position entfernen"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addItem}
              className="text-xs font-semibold text-amber-600 hover:text-amber-700"
            >
              + Position hinzufügen
            </button>
          </div>

          <div className="mt-6 space-y-1.5 border-t border-navy-900/8 pt-4 text-sm">
            <div className="flex justify-between text-navy-700/70">
              <span>Nettobetrag</span>
              <span>€ {netTotal.toLocaleString("de-DE", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-navy-700/70">
              <span>MwSt. (19 %)</span>
              <span>€ {vat.toLocaleString("de-DE", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-navy-900">
              <span>Gesamtbetrag</span>
              <span>€ {grossTotal.toLocaleString("de-DE", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="mt-5">
            <Button icon={false} onClick={createInvoice}>
              Rechnung erstellen
            </Button>
          </div>

          {lastCreated ? (
            <p className="mt-3 text-xs text-emerald-600">
              Rechnung {lastCreated.number} über € {lastCreated.total.toLocaleString("de-DE", { minimumFractionDigits: 2 })} wurde erstellt.
            </p>
          ) : null}
        </div>

        <div className="lg:col-span-2 overflow-x-auto rounded-2xl border border-navy-900/8 bg-white shadow-sm shadow-navy-950/5">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-navy-900/8 bg-mist-100 text-xs uppercase tracking-wide text-navy-700/60">
              <tr>
                <th className="px-4 py-3 font-medium">Rechnung</th>
                <th className="px-4 py-3 font-medium">Kunde</th>
                <th className="px-4 py-3 font-medium">Betrag</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-900/6">
              {invoices.map((inv) => (
                <tr key={inv.number}>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-navy-700/70">{inv.number}</td>
                  <td className="px-4 py-3 text-navy-800">{inv.customer}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-navy-900">
                    € {inv.total.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone[inv.status]}>{inv.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
