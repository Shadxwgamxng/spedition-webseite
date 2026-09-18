"use client";

import { Fragment, useMemo, useState, type FormEvent } from "react";
import { EmployeePageHeader, StatCard } from "@/components/employee/page-header";
import { Badge, Button } from "@/components/ui/primitives";
import { usePolling } from "@/lib/use-polling";
import { useAuth } from "@/lib/auth";
import { useTabletCommand } from "@/lib/use-tablet-command";
import { OrderChat } from "@/components/employee/order-chat";
import type { OrderRecord, OrderStatus, VehicleRecord } from "@/lib/fleet-data";
import type { TabletLocationRecord } from "@/lib/server/db-types";
import { CheckIcon, MapPinIcon, MessageIcon, TruckIcon } from "@/components/ui/icons";

type OrdersResponse = { orders: OrderRecord[] };
type VehiclesResponse = { vehicles: VehicleRecord[] };
type TabletLocationsResponse = { locations: TabletLocationRecord[]; cargoTypes: string[] };

const statusStyles: Record<OrderStatus, "navy" | "amber" | "green" | "red"> = {
  Angefragt: "amber",
  Neu: "navy",
  Disponiert: "amber",
  Unterwegs: "amber",
  Zugestellt: "green",
  Abgelehnt: "red",
};

const statusOptions: OrderStatus[] = ["Neu", "Disponiert", "Unterwegs", "Zugestellt"];
const allFilterOptions: (OrderStatus | "Alle")[] = ["Alle", "Angefragt", ...statusOptions, "Abgelehnt"];
const UNASSIGNED = "— nicht zugewiesen —";

function formatDate(value: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function DispositionPage() {
  const { user } = useAuth();
  const orders = usePolling<OrdersResponse>("/api/orders", 4000);
  const vehicles = usePolling<VehiclesResponse>("/api/vehicles", 4000);
  const tabletLocations = usePolling<TabletLocationsResponse>("/api/tablet-locations", 4000);
  const [filter, setFilter] = useState<OrderStatus | "Alle">("Alle");
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [syncToTablet, setSyncToTablet] = useState(false);
  const { commandNotice, enqueueTabletCommand } = useTabletCommand(orders.refetch);

  const knownLocationNames = useMemo(
    () => (tabletLocations.data?.locations ?? []).map((l) => l.name),
    [tabletLocations.data],
  );
  const knownCargoTypes = tabletLocations.data?.cargoTypes ?? [];

  const allOrders = useMemo(() => orders.data?.orders ?? [], [orders.data]);
  const activeFleet = useMemo(
    () => (vehicles.data?.vehicles ?? []).filter((v) => v.activeDriver),
    [vehicles.data],
  );

  const requests = useMemo(() => allOrders.filter((o) => o.status === "Angefragt"), [allOrders]);

  const filtered = useMemo(() => {
    if (filter === "Alle") return allOrders.filter((o) => o.status !== "Angefragt");
    return allOrders.filter((o) => o.status === filter);
  }, [allOrders, filter]);

  const counts = useMemo(() => {
    const c: Record<OrderStatus, number> = { Angefragt: 0, Neu: 0, Disponiert: 0, Unterwegs: 0, Zugestellt: 0, Abgelehnt: 0 };
    allOrders.forEach((o) => c[o.status]++);
    return c;
  }, [allOrders]);

  // "tablet"-Aufträge kommen aus dem Speditions-Tablet im Spiel — ein
  // direkter PATCH hier würde nur die lokale Website-Kopie ändern, ohne dass
  // sich im Spiel etwas tut. Dispo-Aktionen auf solchen Aufträgen laufen
  // deshalb über die Befehls-Queue (useTabletCommand): das Tablet holt sie
  // sich per Polling ab und führt sie gegen seine eigene Datenbank aus (siehe
  // README "Tablet-Sync"). Der nächste order.upsert-Webhook vom Tablet
  // überschreibt dann den tatsächlichen neuen Status/Fahrer/Fahrzeug.

  async function patchOrder(order: OrderRecord, patch: Record<string, unknown>) {
    await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    await orders.refetch();
  }

  // Ein "tablet"-Auftrag in Endstatus (Zugestellt/Abgelehnt) ist im Spiel
  // bereits abgeschlossen bzw. abgebrochen — löschen betrifft dann nur noch
  // die Website-Anzeige, kein "Im Spiel abbrechen" mehr nötig/möglich.
  function isTabletOrderFinished(order: OrderRecord) {
    return order.status === "Zugestellt" || order.status === "Abgelehnt";
  }

  async function deleteOrderRow(order: OrderRecord) {
    if (order.origin === "tablet") {
      if (isTabletOrderFinished(order)) {
        if (!window.confirm(`Auftrag ${order.id} aus der Liste entfernen? Er ist im Spiel bereits erledigt/abgebrochen.`))
          return;
        await fetch(`/api/orders/${order.id}`, { method: "DELETE" });
        await orders.refetch();
        return;
      }
      if (!window.confirm(`Auftrag ${order.id} im Spiel abbrechen?`)) return;
      const result = await enqueueTabletCommand("cancel_order", { tabletOrderId: order.tabletOrderId });
      // Existiert der Auftrag im Tablet gar nicht mehr (z. B. Altlast von
      // einem früheren/getrennten Server, oder durch den Reset beim
      // Ressourcenstart bereits entfernt) oder antwortet das Tablet gar
      // nicht, bleibt der Datensatz sonst für immer in der Website-Liste
      // hängen - biete in diesem Fall an, ihn nur lokal zu entfernen.
      if (result === null || (!result.ok && result.error === "order_not_found")) {
        if (
          window.confirm(
            `Auftrag ${order.id} konnte im Tablet nicht gefunden werden (evtl. alter/getrennter Server). Trotzdem nur aus der Website-Liste entfernen?`,
          )
        ) {
          await fetch(`/api/orders/${order.id}`, { method: "DELETE" });
          await orders.refetch();
        }
      }
      return;
    }
    if (!window.confirm(`Auftrag ${order.id} wirklich unwiderruflich löschen?`)) return;
    await fetch(`/api/orders/${order.id}`, { method: "DELETE" });
    await orders.refetch();
  }

  function assignVehicle(order: OrderRecord, plate: string) {
    if (order.origin === "tablet") {
      enqueueTabletCommand("assign_order", {
        tabletOrderId: order.tabletOrderId,
        vehiclePlate: plate === UNASSIGNED ? null : plate,
      });
      return;
    }
    if (plate === UNASSIGNED) {
      patchOrder(order, { driverName: null, vehiclePlate: null });
      return;
    }
    const vehicle = activeFleet.find((v) => v.plate === plate);
    patchOrder(order, {
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
    const pickup = form.get("pickup");
    const delivery = form.get("delivery");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: form.get("customer"),
          pickup,
          delivery,
          date: form.get("date"),
          notes: form.get("notes"),
          origin: "intern",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setFormError(json.error ?? "Auftrag konnte nicht erstellt werden.");
        return;
      }

      // Auftrag soll auch im Tablet-Spiel ankommen: Start-/Zielort kommen
      // hier zwangsläufig aus der Dropdown-Auswahl (echte Config.Locations-
      // Namen), nicht aus dem Freitext-Feld oben - landet im offenen
      // Tablet-Auftragspool, ein Disponent im Spiel muss ihn noch
      // disponieren (siehe README "Website-Sync").
      if (syncToTablet) {
        await enqueueTabletCommand("create_order", {
          cargo: form.get("cargo"),
          startLocation: pickup,
          endLocation: delivery,
        });
      }

      await orders.refetch();
      setShowForm(false);
      setSyncToTablet(false);
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

      {commandNotice ? (
        <div
          className={`mt-4 rounded-xl border px-4 py-2.5 text-sm font-medium ${
            commandNotice.startsWith("Aktion im Tablet fehlgeschlagen") || commandNotice.startsWith("Keine Rückmeldung")
              ? "border-red-500/30 bg-red-50 text-red-700"
              : "border-navy-900/10 bg-mist-100 text-navy-700"
          }`}
        >
          {commandNotice}
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statusOptions.map((s) => (
          <StatCard key={s} label={s} value={String(counts[s])} />
        ))}
      </div>

      {requests.length > 0 ? (
        <div className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-navy-900">
            Neue Anfragen von der Website
            <Badge tone="amber">{requests.length}</Badge>
          </h2>
          <div className="space-y-4">
            {requests.map((order) => (
              <RequestCard key={order.id} order={order} onDecided={orders.refetch} />
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-8 space-y-6">
        <div>
          {showForm ? (
            <form
              onSubmit={handleCreate}
              className="mb-6 grid grid-cols-1 gap-3 rounded-2xl border border-navy-900/8 bg-white p-5 shadow-sm shadow-navy-950/5 sm:grid-cols-2"
            >
              <Field label="Kunde" name="customer" required />
              <Field label="Termin" name="date" type="date" required />
              {syncToTablet ? (
                <>
                  <SelectField label="Abholung (Tablet-Standort)" name="pickup" options={knownLocationNames} required />
                  <SelectField label="Ziel (Tablet-Standort)" name="delivery" options={knownLocationNames} required />
                  <SelectField label="Frachtart" name="cargo" options={knownCargoTypes} required />
                </>
              ) : (
                <>
                  <Field label="Abholung" name="pickup" placeholder="z. B. Falkenwalde" required />
                  <Field label="Ziel" name="delivery" placeholder="z. B. Berlin" required />
                </>
              )}
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
              <label className="flex items-center gap-2 text-xs font-medium text-navy-800 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={syncToTablet}
                  onChange={(e) => setSyncToTablet(e.target.checked)}
                  className="h-4 w-4 rounded border-navy-900/25"
                />
                Auch im Tablet-Spiel als offenen Auftrag anlegen (ein Disponent im Spiel muss ihn dort noch
                disponieren)
                {syncToTablet && knownLocationNames.length === 0 ? (
                  <span className="text-amber-600">— keine Tablet-Standorte bekannt, Website-Sync aktiv?</span>
                ) : null}
              </label>
              {formError ? <p className="text-sm text-red-600 sm:col-span-2">{formError}</p> : null}
              <div className="sm:col-span-2">
                <Button type="submit" icon={false} className={submitting ? "opacity-60" : ""}>
                  {submitting ? "Wird angelegt…" : "Auftrag anlegen"}
                </Button>
              </div>
            </form>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            {allFilterOptions.map((s) => (
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
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-navy-900/8 bg-mist-100 text-xs uppercase tracking-wide text-navy-700/60">
                <tr>
                  <th className="px-4 py-3 font-medium">Auftrag</th>
                  <th className="px-4 py-3 font-medium">Kunde</th>
                  <th className="px-4 py-3 font-medium">Route</th>
                  <th className="px-4 py-3 font-medium">Termin</th>
                  <th className="px-4 py-3 font-medium">Fahrzeug (aktiv)</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Nachrichten</th>
                  <th className="px-4 py-3 font-medium">&nbsp;</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-900/6">
                {filtered.map((order) => {
                  const unreadCount = order.messages.length;
                  const expanded = expandedId === order.id;
                  return (
                    <Fragment key={order.id}>
                      <tr className="align-middle">
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-navy-900">
                          {order.id}
                          {order.origin === "tablet" ? (
                            <div className="mt-1 font-sans text-[10px] font-semibold uppercase tracking-wide text-amber-600">
                              🎮 Tablet
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-navy-800">{order.customer}</td>
                        <td className="px-4 py-3 text-navy-700/80">
                          {order.pickup} → {order.delivery}
                        </td>
                        <td className="px-4 py-3">
                          {order.origin === "tablet" ? (
                            <span className="text-xs text-navy-700/50">{formatDate(order.date)}</span>
                          ) : (
                            <input
                              type="date"
                              value={order.date}
                              onChange={(e) => patchOrder(order, { date: e.target.value })}
                              className="rounded-lg border border-navy-900/15 bg-white px-2 py-1.5 text-xs"
                            />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={order.vehiclePlate ?? UNASSIGNED}
                            onChange={(e) => assignVehicle(order, e.target.value)}
                            className="rounded-lg border border-navy-900/15 bg-white px-2 py-1.5 text-xs"
                          >
                            <option value={UNASSIGNED}>{UNASSIGNED}</option>
                            {(order.origin === "tablet" ? vehicles.data?.vehicles ?? [] : activeFleet).map((v) => (
                              <option key={v.plate} value={v.plate}>
                                {v.plate} · {v.activeDriver ?? (order.origin === "tablet" ? "im Tablet zugewiesen" : "")}
                              </option>
                            ))}
                            {order.vehiclePlate &&
                            !(order.origin === "tablet" ? vehicles.data?.vehicles ?? [] : activeFleet).some(
                              (v) => v.plate === order.vehiclePlate,
                            ) ? (
                              <option value={order.vehiclePlate}>
                                {order.vehiclePlate} · {order.driverName} (abgemeldet)
                              </option>
                            ) : null}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          {order.origin === "tablet" ? (
                            <Badge tone={statusStyles[order.status]}>{order.status}</Badge>
                          ) : (
                            <>
                              <select
                                value={order.status}
                                onChange={(e) => patchOrder(order, { status: e.target.value })}
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
                            </>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setExpandedId(expanded ? null : order.id)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-navy-900/15 px-3 py-1.5 text-xs font-semibold text-navy-800 hover:bg-mist-100"
                          >
                            <MessageIcon className="h-3.5 w-3.5" />
                            {unreadCount || 0}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => deleteOrderRow(order)}
                            className="text-xs font-semibold text-red-600 hover:text-red-700"
                          >
                            {order.origin === "tablet"
                              ? isTabletOrderFinished(order)
                                ? "Aus der Liste entfernen"
                                : "Im Spiel abbrechen"
                              : "Löschen"}
                          </button>
                        </td>
                      </tr>
                      {expanded ? (
                        <tr>
                          <td colSpan={8} className="bg-mist-100/60 px-4 py-4">
                            {user ? (
                              <OrderChat order={order} from="dispo" authorName={user.name} onSent={orders.refetch} />
                            ) : null}
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-sm text-navy-700/50">
                      {orders.data ? "Keine Aufträge in dieser Ansicht." : "Aufträge werden geladen…"}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="max-w-sm rounded-2xl border border-navy-900/8 bg-white p-5 shadow-sm shadow-navy-950/5">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-amber-600">
              <TruckIcon className="h-4 w-4" />
              Aktive Fahrzeuge
            </div>
            <p className="mt-1 text-xs text-navy-700/60">
              Fahrer, die gerade auf ein Fahrzeug angemeldet sind — im Spiel (Fahrerkarte eingesteckt) oder über die
              Website — und einem Auftrag zugewiesen werden können.
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

function RequestCard({ order, onDecided }: { order: OrderRecord; onDecided: () => Promise<void> }) {
  const [confirmedDate, setConfirmedDate] = useState(order.requestedDeliveryDate || order.requestedPickupDate || "");
  const [busy, setBusy] = useState(false);

  async function accept() {
    if (!confirmedDate) return;
    setBusy(true);
    try {
      await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Neu", date: confirmedDate }),
      });
      await onDecided();
    } finally {
      setBusy(false);
    }
  }

  async function decline() {
    setBusy(true);
    try {
      await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Abgelehnt" }),
      });
      await onDecided();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-amber-400/40 bg-amber-50 p-5 shadow-sm shadow-navy-950/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-mono text-xs font-semibold text-navy-700/60">{order.id}</div>
          <h3 className="mt-0.5 text-base font-semibold text-navy-900">{order.customer}</h3>
          <div className="mt-1 text-xs text-navy-700/70">
            {order.contactName} {order.contactName && "·"} {order.email} {order.phone && "·"} {order.phone}
          </div>
        </div>
        <Badge tone="amber">Wartet auf Bestätigung</Badge>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-start gap-2 text-sm text-navy-800 lg:col-span-2">
          <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <div className="text-xs uppercase tracking-wide text-navy-700/50">Route</div>
            {order.pickup} → {order.delivery}
          </div>
        </div>
        <div className="text-sm text-navy-800">
          <div className="text-xs uppercase tracking-wide text-navy-700/50">Wunsch Abholung</div>
          {formatDate(order.requestedPickupDate)}
        </div>
        <div className="text-sm text-navy-800">
          <div className="text-xs uppercase tracking-wide text-navy-700/50">Wunsch Zustellung</div>
          {formatDate(order.requestedDeliveryDate)}
        </div>
        {order.cargoType ? (
          <div className="text-sm text-navy-800 lg:col-span-2">
            <div className="text-xs uppercase tracking-wide text-navy-700/50">Ladung</div>
            {order.cargoType}
          </div>
        ) : null}
        {order.notes ? (
          <div className="text-sm text-navy-800 sm:col-span-2 lg:col-span-4">
            <div className="text-xs uppercase tracking-wide text-navy-700/50">Hinweise</div>
            <p className="whitespace-pre-line">{order.notes}</p>
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-amber-400/30 pt-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-navy-800" htmlFor={`confirm-${order.id}`}>
            Bestätigter Liefertermin
          </label>
          <input
            id={`confirm-${order.id}`}
            type="date"
            value={confirmedDate}
            onChange={(e) => setConfirmedDate(e.target.value)}
            className="rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
        <Button icon={false} disabled={busy || !confirmedDate} onClick={accept}>
          Annehmen &amp; Termin bestätigen
        </Button>
        <button
          type="button"
          disabled={busy}
          onClick={decline}
          className="rounded-full border border-navy-900/15 px-4 py-2 text-sm font-semibold text-navy-700 hover:bg-white disabled:opacity-50"
        >
          Ablehnen
        </button>
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

function SelectField({
  label,
  name,
  options,
  required = false,
}: {
  label: string;
  name: string;
  options: string[];
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-navy-800" htmlFor={name}>
        {label}
      </label>
      <select
        id={name}
        name={name}
        required={required}
        defaultValue=""
        className="w-full rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm text-navy-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
      >
        <option value="" disabled>
          Bitte wählen…
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
