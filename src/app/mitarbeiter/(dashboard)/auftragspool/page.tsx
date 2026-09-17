"use client";

import { useMemo, useState } from "react";
import { EmployeePageHeader } from "@/components/employee/page-header";
import { Badge, Card } from "@/components/ui/primitives";
import { usePolling } from "@/lib/use-polling";
import { useTabletCommand } from "@/lib/use-tablet-command";
import type { OrderRecord, VehicleRecord } from "@/lib/fleet-data";
import { BoxIcon, TruckIcon } from "@/components/ui/icons";

type OrdersResponse = { orders: OrderRecord[] };
type VehiclesResponse = { vehicles: VehicleRecord[] };
const UNASSIGNED = "— Fahrzeug wählen —";

export default function AuftragspoolPage() {
  const orders = usePolling<OrdersResponse>("/api/orders", 4000);
  const vehicles = usePolling<VehiclesResponse>("/api/vehicles", 4000);
  const { commandNotice, enqueueTabletCommand } = useTabletCommand(orders.refetch);
  const [assigning, setAssigning] = useState<string | null>(null);

  // Ein echter, noch unbearbeiteter Pool-Auftrag: kommt aus dem Tablet, hat
  // (noch) weder Fahrzeug noch Fahrer — Aufträge, die bereits disponiert
  // wurden, aber im Spiel noch nicht angenommen sind, mappen zwar ebenfalls
  // auf den Website-Status "Neu" (siehe mapTabletOrderStatus in store.ts),
  // haben aber schon ein vehiclePlate gesetzt und gehören nicht mehr hierher.
  const poolOrders = useMemo(
    () =>
      (orders.data?.orders ?? []).filter(
        (o) => o.origin === "tablet" && o.status === "Neu" && !o.vehiclePlate && !o.driverName,
      ),
    [orders.data],
  );

  async function assign(order: OrderRecord, plate: string) {
    if (!plate) return;
    setAssigning(order.id);
    try {
      await enqueueTabletCommand("assign_order", { tabletOrderId: order.tabletOrderId, vehiclePlate: plate });
    } finally {
      setAssigning(null);
    }
  }

  return (
    <div>
      <EmployeePageHeader
        title="Auftragspool"
        description="Offene, im Spiel noch unzugewiesene Aufträge — hier direkt einem Fahrzeug zuweisen, die Disposition kommt sofort ingame beim Fahrer an."
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

      <div className="mt-6 space-y-4">
        {poolOrders.map((order) => (
          <Card key={order.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-amber-400">
                <BoxIcon className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-navy-700/60">{order.id}</span>
                  <Badge tone="navy">{order.customer}</Badge>
                </div>
                <div className="mt-1 text-sm font-semibold text-navy-900">
                  {order.pickup} → {order.delivery}
                </div>
                {order.notes ? <div className="mt-0.5 text-xs text-navy-700/60">{order.notes}</div> : null}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <TruckIcon className="h-4 w-4 shrink-0 text-navy-700/40" />
              <select
                defaultValue=""
                disabled={assigning === order.id}
                onChange={(e) => assign(order, e.target.value)}
                className="rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50"
              >
                <option value="" disabled>
                  {assigning === order.id ? "Wird disponiert…" : UNASSIGNED}
                </option>
                {(vehicles.data?.vehicles ?? []).map((v) => (
                  <option key={v.plate} value={v.plate}>
                    {v.plate} · {v.activeDriver ?? "im Tablet zugewiesen"}
                  </option>
                ))}
              </select>
            </div>
          </Card>
        ))}

        {orders.data && poolOrders.length === 0 ? (
          <p className="rounded-2xl border border-navy-900/8 bg-white px-6 py-10 text-center text-sm text-navy-700/50">
            Aktuell keine offenen Aufträge im Pool.
          </p>
        ) : null}
        {!orders.data ? <p className="text-sm text-navy-700/50">Aufträge werden geladen…</p> : null}
      </div>
    </div>
  );
}
