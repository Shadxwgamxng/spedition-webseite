"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { EmployeePageHeader, StatCard } from "@/components/employee/page-header";
import { Button } from "@/components/ui/primitives";
import { downloadInvoicePdf } from "@/lib/invoice-pdf";
import { usePolling } from "@/lib/use-polling";
import type { CompanyInfo, CustomerRecord } from "@/lib/server/db-types";

type LineItem = { description: string; qty: number; price: number };
type InvoiceStatus = "Offen" | "Bezahlt" | "Überfällig";

type Invoice = {
  number: string;
  customerId: string;
  customer: string;
  customerNumber: string;
  sachbearbeiter: string;
  date: string;
  total: number;
  status: InvoiceStatus;
  items: LineItem[];
};

const statusTone: Record<InvoiceStatus, "amber" | "green" | "navy"> = {
  Offen: "amber",
  Bezahlt: "green",
  Überfällig: "navy",
};

const statusOptions: InvoiceStatus[] = ["Offen", "Bezahlt", "Überfällig"];

const emptyItem: LineItem = { description: "", qty: 1, price: 0 };

function formatDate(value: string): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function RechnungenPage() {
  const { user } = useAuth();
  const { data, refetch } = usePolling<{ invoices: Invoice[] }>("/api/invoices", 5000);
  const { data: customerData } = usePolling<{ customers: CustomerRecord[] }>("/api/customers", 8000);
  const invoices = useMemo(() => data?.invoices ?? [], [data]);
  const customers = customerData?.customers ?? [];

  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ ...emptyItem }]);
  const [lastCreated, setLastCreated] = useState<Invoice | null>(null);
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingNumber, setDeletingNumber] = useState<string | null>(null);
  const [exportingNumber, setExportingNumber] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/company")
      .then((res) => res.json())
      .then((json) => setCompany(json.company))
      .catch(() => {});
  }, []);

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

  async function createInvoice() {
    setError(null);
    if (!customerId || !user || netTotal <= 0) return;
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, sachbearbeiter: user.name, items, total: grossTotal }),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      setError(json.error ?? "Rechnung konnte nicht erstellt werden.");
      return;
    }
    await refetch();
    setLastCreated(json.invoice);
    setCustomerId("");
    setItems([{ ...emptyItem }]);
  }

  async function changeStatus(number: string, status: InvoiceStatus) {
    await fetch(`/api/invoices/${number}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await refetch();
  }

  async function handleDelete(number: string) {
    if (!window.confirm(`Rechnung ${number} wirklich unwiderruflich löschen?`)) return;
    setDeletingNumber(number);
    try {
      await fetch(`/api/invoices/${number}`, { method: "DELETE" });
      await refetch();
    } finally {
      setDeletingNumber(null);
    }
  }

  async function exportPdf(invoice: Invoice) {
    if (!company) return;
    setExportingNumber(invoice.number);
    try {
      await downloadInvoicePdf(invoice, company);
    } finally {
      setExportingNumber(null);
    }
  }

  return (
    <div>
      <EmployeePageHeader
        title="Rechnungserstellung"
        description="Rechnungen direkt im System erstellen, Positionen kalkulieren und den Zahlungsstatus verwalten."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Rechnungen gesamt" value={String(invoices.length)} />
        <StatCard label="Offene Forderungen" value={`€ ${openTotal.toLocaleString("de-DE", { minimumFractionDigits: 2 })}`} tone={openTotal > 0 ? "warn" : "good"} />
        <StatCard label="Bezahlt" value={String(invoices.filter((i) => i.status === "Bezahlt").length)} tone="good" />
        <StatCard label="Überfällig" value={String(invoices.filter((i) => i.status === "Überfällig").length)} tone={invoices.some((i) => i.status === "Überfällig") ? "warn" : "good"} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-2xl border border-navy-900/8 bg-white p-6 shadow-sm shadow-navy-950/5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-600">Neue Rechnung</h2>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-navy-800" htmlFor="customer">
                Kunde
              </label>
              <select
                id="customer"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="">— Kunde auswählen —</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName} ({c.customerNumber})
                  </option>
                ))}
              </select>
              {customers.length === 0 ? (
                <p className="mt-1.5 text-xs text-navy-700/50">
                  Noch keine Kunden angelegt —{" "}
                  <Link href="/mitarbeiter/kundenstammbaum" className="font-semibold text-amber-600 hover:text-amber-700">
                    im Kundenstammbaum anlegen
                  </Link>
                  .
                </p>
              ) : null}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-navy-800">Sachbearbeiter</label>
              <div className="flex h-[38px] items-center rounded-lg border border-navy-900/10 bg-mist-50 px-3 text-sm text-navy-700/80">
                {user?.name ?? "—"}
              </div>
            </div>
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

          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

          <div className="mt-5">
            <Button icon={false} onClick={createInvoice} disabled={!customerId || netTotal <= 0}>
              Rechnung erstellen
            </Button>
          </div>

          {lastCreated ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p className="text-xs text-emerald-600">
                Rechnung {lastCreated.number} über € {lastCreated.total.toLocaleString("de-DE", { minimumFractionDigits: 2 })} wurde erstellt.
              </p>
              <button
                type="button"
                onClick={() => exportPdf(lastCreated)}
                disabled={!company}
                className="text-xs font-semibold text-amber-600 hover:text-amber-700 disabled:opacity-50"
              >
                Als PDF herunterladen
              </button>
            </div>
          ) : null}
        </div>

        <div className="lg:col-span-2 overflow-x-auto rounded-2xl border border-navy-900/8 bg-white shadow-sm shadow-navy-950/5">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-navy-900/8 bg-mist-100 text-xs uppercase tracking-wide text-navy-700/60">
              <tr>
                <th className="px-4 py-3 font-medium">Rechnung</th>
                <th className="px-4 py-3 font-medium">Kunde</th>
                <th className="px-4 py-3 font-medium">Datum</th>
                <th className="px-4 py-3 font-medium">Sachbearbeiter</th>
                <th className="px-4 py-3 font-medium">Betrag</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">&nbsp;</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-900/6">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-navy-700/60">
                    Noch keine Rechnungen erstellt.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.number}>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="font-mono text-xs text-navy-700/70">{inv.number}</div>
                      {inv.customerNumber ? (
                        <div className="font-mono text-[10px] text-navy-700/40">Kd.-Nr. {inv.customerNumber}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-navy-800">{inv.customer}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-navy-700/70">{formatDate(inv.date)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-navy-700/70">{inv.sachbearbeiter || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-navy-900">
                      € {inv.total.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={inv.status}
                        onChange={(e) => changeStatus(inv.number, e.target.value as InvoiceStatus)}
                        className={`rounded-full border-0 px-2.5 py-1 text-xs font-semibold outline-none ${
                          statusTone[inv.status] === "amber"
                            ? "bg-amber-400/15 text-amber-700"
                            : statusTone[inv.status] === "green"
                              ? "bg-emerald-500/10 text-emerald-700"
                              : "bg-navy-900/8 text-navy-800"
                        }`}
                      >
                        {statusOptions.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => exportPdf(inv)}
                          disabled={!company || exportingNumber === inv.number}
                          className="text-xs font-semibold text-amber-600 hover:text-amber-700 disabled:opacity-50"
                        >
                          {exportingNumber === inv.number ? "…" : "PDF"}
                        </button>
                        <button
                          type="button"
                          disabled={deletingNumber === inv.number}
                          onClick={() => handleDelete(inv.number)}
                          className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          {deletingNumber === inv.number ? "…" : "Löschen"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
