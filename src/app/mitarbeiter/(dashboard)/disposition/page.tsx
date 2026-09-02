"use client";

import { useMemo, useState, type FormEvent } from "react";
import { EmployeePageHeader, StatCard } from "@/components/employee/page-header";
import { Badge, Button } from "@/components/ui/primitives";
import { usePolling } from "@/lib/use-polling";
import type { OrderRecord, OrderStatus, VehicleRecord } from "@/lib/fleet-data";
import { CheckIcon, TruckIcon } from "@/components/ui/icons";

type OrdersResponse = { orders: OrderRecord[] };
type VehiclesResponse = { vehicles: VehicleRecord[] };

const statusStyles: Record<OrderStatus, "navy" | "amber" | "green"> = {
  Neu: "navy",
  Disponiert: "amber",
  Unterwegs: "amber",
  Zugestellt: "green",
};

const statusOptions: OrderStatus[] = ["Neu", "Disponiert", "Unterwegs", "Zugestellt"];
const UNASSIGNED = "— nicht zugewiesen —";

export default function DispositionPage() {
  const orders = usePolling<OrdersResponse>("/api/orders", 4000);
  const vehicles = usePolling<VehiclesResponse>("/api/vehicles", 4000);
  const [filter, setFilter] = useState<OrderStatus | "Alle">("Alle");
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const allOrders = useMemo(() => orders.data?.orders ?? [], [orders.data]);
  const activeFleet = useMemo(
    () => (vehicles.data?.vehicles ?? []).filter((v) => v.activeDriver),
    [vehicles.data],
  );

  const filtered = useMemo(
    () => (filter === "Alle" ? allOrders : allOrders.filter((o) => o.status === filter)),
    [allOrders, filter],
  );

  const counts = useMemo(() => {
    const c: Record<OrderStatus, number> = { Neu: 0, Disponiert: 0, Unterwegs: 0, Zugestellt: 0 };
    allOrders.forEach((o) => c[o.status]++);
    return c;
  }, [allOrders]);

  async function patchOrder(id: string, patch: Record<string, unknown>) {
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    await orders.refetch();
  }

  function assignVehicle(order: OrderRecord, plate: string) {
    if (plate === UNASSIGNED) {
      patchOrder(order.id, { driverName: null, vehiclePlate: null });
      return;
    }
    const vehicle = activeFleet.find((v) => v.plate === plate);
    patchOrder(order.id, {
      vehiclePlate: plate,
      driverName: vehicle?.activeDriver ?? null,
      status: order.status === "Neu" ? "Disponiert" : order.status,
    });
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: form.get("customer"),
          pickup: form.get("pickup"),
          delivery: form.get("delivery"),
          date: form.get("date"),
          notes: form.get("notes"),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setFormError(json.error ?? "Auftrag konnte nicht erstellt werden.");
        return;
      }
      await orders.refetch();
      setShowForm(false);
      event.currentTarget.reset();
    } catch {
      setFormError("Verbindung zum Server fehlgeschlagen.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <EmployeePageHeader
        title="Disposition"
        description="Touren planen, Fahrer und Fahrzeuge zuweisen und den Status jeder Sendung im Blick behalten."
        action={
          <Button icon={false} onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Formular schließen" : "Neuer Auftrag"}
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statusOptions.map((s) => (
          <StatCard key={s} label={s} value={String(counts[s])} />
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {showForm ? (
            <form
              onSubmit={handleCreate}
              className="mb-6 grid grid-cols-1 gap-3 rounded-2xl border border-navy-900/8 bg-white p-5 shadow-sm shadow-navy-950/5 sm:grid-cols-2"
            >
              <Field label="Kunde" name="customer" required />
              <Field label="Termin" name="date" type="date" required />
              <Field label="Abholung" name="pickup" placeholder="z. B. Falkenwalde" required />
              <Field label="Ziel" name="delivery" placeholder="z. B. Berlin" required />
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-navy-800" htmlFor="notes">
                  Hinweise
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={2}
                  className="w-full rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
              {formError ? <p className="text-sm text-red-600 sm:col-span-2">{formError}</p> : null}
              <div className="sm:col-span-2">
                <Button type="submit" icon={false} className={submitting ? "opacity-60" : ""}>
                  {submitting ? "Wird angelegt…" : "Auftrag anlegen"}
                </Button>
              </div>
            </form>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            {(["Alle", ...statusOptions] as const).map((s) => (
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
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-navy-900/8 bg-mist-100 text-xs uppercase tracking-wide text-navy-700/60">
                <tr>
                  <th className="px-4 py-3 font-medium">Auftrag</th>
                  <th className="px-4 py-3 font-medium">Kunde</th>
                  <th className="px-4 py-3 font-medium">Route</th>
                  <th className="px-4 py-3 font-medium">Fahrzeug (aktiv)</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-900/6">
                {filtered.map((order) => (
                  <tr key={order.id} className="align-middle">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-navy-900">{order.id}</td>
                    <td className="px-4 py-3 text-navy-800">{order.customer}</td>
                    <td className="px-4 py-3 text-navy-700/80">
                      {order.pickup} → {order.delivery}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={order.vehiclePlate ?? UNASSIGNED}
                        onChange={(e) => assignVehicle(order, e.target.value)}
                        className="rounded-lg border border-navy-900/15 bg-white px-2 py-1.5 text-xs"
                      >
                        <option value={UNASSIGNED}>{UNASSIGNED}</option>
                        {activeFleet.map((v) => (
                          <option key={v.plate} value={v.plate}>
                            {v.plate} · {v.activeDriver}
                          </option>
                        ))}
                        {order.vehiclePlate && !activeFleet.some((v) => v.plate === order.vehiclePlate) ? (
                          <option value={order.vehiclePlate}>
                            {order.vehiclePlate} · {order.driverName} (abgemeldet)
                          </option>
                        ) : null}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={(e) => patchOrder(order.id, { status: e.target.value })}
                        className="rounded-lg border border-navy-900/15 bg-white px-2 py-1.5 text-xs font-medium"
                      >
                        {statusOptions.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <div className="mt-1.5">
                        <Badge tone={statusStyles[order.status]}>{order.status}</Badge>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-navy-700/50">
                      {orders.data ? "Keine Aufträge in dieser Ansicht." : "Aufträge werden geladen…"}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="rounded-2xl border border-navy-900/8 bg-white p-5 shadow-sm shadow-navy-950/5">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-amber-600">
              <TruckIcon className="h-4 w-4" />
              Aktive Fahrzeuge
            </div>
            <p className="mt-1 text-xs text-navy-700/60">
              Fahrer, die sich gerade auf ein Fahrzeug angemeldet haben und einem Auftrag zugewiesen werden können.
            </p>
            <div className="mt-4 space-y-2">
              {activeFleet.map((v) => (
                <div
                  key={v.plate}
                  className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5"
                >
                  <div>
                    <div className="font-mono text-xs font-semibold text-navy-900">{v.plate}</div>
                    <div className="text-xs text-navy-700/70">{v.activeDriver}</div>
                  </div>
                  <CheckIcon className="h-4 w-4 text-emerald-600" />
                </div>
              ))}
              {vehicles.data && activeFleet.length === 0 ? (
                <p className="text-xs text-navy-700/50">Aktuell ist kein Fahrer auf einem Fahrzeug angemeldet.</p>
              ) : null}
              {!vehicles.data ? <p className="text-xs text-navy-700/50">Wird geladen…</p> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-navy-800" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm text-navy-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
      />
    </div>
  );
}
