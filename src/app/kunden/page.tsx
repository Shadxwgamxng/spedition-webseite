"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/site/logo";
import { Badge } from "@/components/ui/primitives";
import { CheckIcon } from "@/components/ui/icons";
import { useCustomerAuth } from "@/lib/customer-auth";
import { usePolling } from "@/lib/use-polling";
import type { OrderRecord, OrderStatus } from "@/lib/fleet-data";

const cargoTypes = [
  "Palettenware (Stückgut)",
  "Komplettladung (LKW)",
  "Teilladung",
  "Kühl-/Temperaturgut",
  "Gefahrgut (ADR)",
  "Sonstiges",
];

const statusTone: Record<OrderStatus, "amber" | "green" | "navy" | "red"> = {
  Angefragt: "amber",
  Neu: "navy",
  Disponiert: "navy",
  Unterwegs: "amber",
  Zugestellt: "green",
  Abgelehnt: "red",
};

function formatDate(value: string): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function KundenPortalPage() {
  const { customer, status, logout } = useCustomerAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "ready" && !customer) {
      router.replace("/kunden/login");
    }
  }, [status, customer, router]);

  if (status === "loading" || !customer) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mist-50 text-sm text-navy-700/60">
        Wird geladen…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mist-50">
      <header className="border-b border-navy-900/8 bg-white">
        <div className="container-page flex h-16 items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-semibold text-navy-900">{customer.companyName}</div>
              <div className="text-xs text-navy-700/60">Kd.-Nr. {customer.customerNumber}</div>
            </div>
            <button
              type="button"
              onClick={() => {
                logout();
                router.replace("/kunden/login");
              }}
              className="rounded-full border border-navy-900/15 px-3.5 py-1.5 text-xs font-semibold text-navy-800 hover:bg-navy-900/5"
            >
              Abmelden
            </button>
          </div>
        </div>
      </header>

      <main className="container-page py-10">
        <h1 className="text-2xl font-bold text-navy-900 sm:text-3xl">Internes Dispositionssystem</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-navy-700/70">
          Willkommen, {customer.contactName || customer.companyName}. Reichen Sie neue Aufträge direkt bei unserer
          Disposition ein und behalten Sie den Status Ihrer bisherigen Aufträge im Blick.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <NewOrderForm />
          </div>
          <div className="lg:col-span-3">
            <OrderHistory />
          </div>
        </div>
      </main>
    </div>
  );
}

function NewOrderForm() {
  const [submitted, setSubmitted] = useState(false);
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = new FormData(event.currentTarget);

    const weight = form.get("weight");
    const units = form.get("units");
    const dimensions = form.get("dimensions");
    const extraDetails = [
      weight ? `Gewicht: ca. ${weight} kg` : null,
      units ? `Menge: ${units} Paletten/Colli` : null,
      dimensions ? `Maße: ${dimensions}` : null,
    ]
      .filter(Boolean)
      .join(" · ");
    const notes = [extraDetails, form.get("notes")].filter(Boolean).join("\n");

    try {
      const res = await fetch("/api/customer-portal/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickup: form.get("pickup"),
          delivery: form.get("delivery"),
          requestedPickupDate: form.get("pickupDate"),
          requestedDeliveryDate: form.get("deliveryDate"),
          cargoType: form.get("cargoType"),
          notes,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Auftrag konnte nicht übermittelt werden.");
        return;
      }
      setReference(json.order.id);
      setSubmitted(true);
    } catch {
      setError("Verbindung zum Server fehlgeschlagen. Bitte versuchen Sie es erneut.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6">
        <CheckIcon className="h-6 w-6 text-emerald-600" />
        <div>
          <div className="font-semibold text-navy-900">Auftrag übermittelt!</div>
          <p className="mt-1 text-sm text-navy-700/75">
            Referenznummer <span className="font-mono font-semibold text-navy-900">{reference}</span>. Unsere
            Disposition prüft Ihre Anfrage und bestätigt Ihnen den Liefertermin.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSubmitted(false);
            setReference("");
          }}
          className="text-xs font-semibold text-amber-600 hover:text-amber-700"
        >
          Weiteren Auftrag einreichen
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-navy-900/8 bg-white p-6 shadow-sm shadow-navy-950/5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-600">Neuer Auftrag</h2>

      <div className="grid grid-cols-1 gap-4">
        <Field label="Abholadresse (PLZ, Ort)" name="pickup" required />
        <Field label="Zieladresse (PLZ, Ort)" name="delivery" required />
        <Field label="Wunschtermin Abholung" name="pickupDate" type="date" required />
        <Field label="Wunschtermin Zustellung" name="deliveryDate" type="date" />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-navy-800" htmlFor="cargoType">
          Art der Ladung
        </label>
        <select
          id="cargoType"
          name="cargoType"
          required
          className="w-full rounded-xl border border-navy-900/15 bg-white px-3.5 py-2.5 text-sm text-navy-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
        >
          {cargoTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Gewicht (ca. kg)" name="weight" type="number" />
        <Field label="Anzahl Paletten / Colli" name="units" type="number" />
      </div>
      <Field label="Maße (L x B x H in cm)" name="dimensions" />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-navy-800" htmlFor="notes">
          Weitere Hinweise
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="z. B. Ladehilfsmittel, Zugangsbeschränkungen, besondere Anforderungen"
          className="w-full rounded-xl border border-navy-900/15 bg-white px-3.5 py-2.5 text-sm text-navy-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-navy-950 hover:bg-amber-400 disabled:opacity-60"
      >
        {submitting ? "Wird übermittelt…" : "Auftrag einreichen"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-navy-800" htmlFor={name}>
        {label}
        {required ? <span className="text-amber-600"> *</span> : null}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="w-full rounded-xl border border-navy-900/15 bg-white px-3.5 py-2.5 text-sm text-navy-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
      />
    </div>
  );
}

function OrderHistory() {
  const { data } = usePolling<{ orders: OrderRecord[] }>("/api/customer-portal/orders", 6000);
  const orders = data?.orders ?? [];

  return (
    <div className="overflow-x-auto rounded-2xl border border-navy-900/8 bg-white shadow-sm shadow-navy-950/5">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-navy-900/8 bg-mist-100 text-xs uppercase tracking-wide text-navy-700/60">
          <tr>
            <th className="px-4 py-3 font-medium">Auftrag</th>
            <th className="px-4 py-3 font-medium">Strecke</th>
            <th className="px-4 py-3 font-medium">Termin</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-navy-900/6">
          {orders.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-sm text-navy-700/60">
                Noch keine Aufträge eingereicht.
              </td>
            </tr>
          ) : (
            orders.map((order) => (
              <tr key={order.id}>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-navy-700/70">{order.id}</td>
                <td className="px-4 py-3 text-navy-800">
                  {order.pickup} → {order.delivery}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-navy-700/70">
                  {order.date ? formatDate(order.date) : `Wunsch: ${formatDate(order.requestedPickupDate)}`}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone[order.status]}>{order.status}</Badge>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
