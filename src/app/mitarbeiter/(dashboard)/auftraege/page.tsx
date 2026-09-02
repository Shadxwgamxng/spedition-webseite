"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { EmployeePageHeader } from "@/components/employee/page-header";
import { Badge } from "@/components/ui/primitives";
import { OrderChat } from "@/components/employee/order-chat";
import { usePolling } from "@/lib/use-polling";
import type { OrderRecord, OrderStatus } from "@/lib/fleet-data";
import { MapPinIcon } from "@/components/ui/icons";

type OrdersResponse = { orders: OrderRecord[] };

const statusStyles: Record<OrderStatus, "navy" | "amber" | "green"> = {
  Neu: "navy",
  Disponiert: "amber",
  Unterwegs: "amber",
  Zugestellt: "green",
};

export default function AuftraegePage() {
  const { user } = useAuth();
  const { data, refetch } = usePolling<OrdersResponse>("/api/orders", 4000);

  const myOrders = useMemo(() => {
    if (!user) return [];
    const all = data?.orders ?? [];
    return all
      .filter((o) => o.driverName === user.name)
      .sort((a, b) => (a.status === "Zugestellt" ? 1 : 0) - (b.status === "Zugestellt" ? 1 : 0));
  }, [data, user]);

  if (!user) return null;

  return (
    <div>
      <EmployeePageHeader
        title="Aktuelle Aufträge"
        description="Deine zugewiesenen Aufträge mit allen Informationen – und direkter Kontakt zur Disposition."
      />

      {!data ? (
        <p className="text-sm text-navy-700/60">Aufträge werden geladen…</p>
      ) : myOrders.length === 0 ? (
        <p className="rounded-2xl border border-navy-900/8 bg-white p-6 text-sm text-navy-700/60">
          Dir ist aktuell kein Auftrag zugewiesen. Sobald die Disposition dir einen Auftrag zuweist, erscheint er
          hier.
        </p>
      ) : (
        <div className="space-y-6">
          {myOrders.map((order) => (
            <div key={order.id} className="rounded-2xl border border-navy-900/8 bg-white p-6 shadow-sm shadow-navy-950/5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-xs font-semibold text-navy-700/60">{order.id}</div>
                  <h2 className="mt-1 text-lg font-semibold text-navy-900">{order.customer}</h2>
                </div>
                <Badge tone={statusStyles[order.status]}>{order.status}</Badge>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-2 text-sm text-navy-800">
                  <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <div>
                    <div className="text-xs uppercase tracking-wide text-navy-700/50">Route</div>
                    {order.pickup} → {order.delivery}
                  </div>
                </div>
                <div className="text-sm text-navy-800">
                  <div className="text-xs uppercase tracking-wide text-navy-700/50">Termin</div>
                  {new Date(order.date).toLocaleDateString("de-DE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </div>
                {order.notes ? (
                  <div className="sm:col-span-2 text-sm text-navy-800">
                    <div className="text-xs uppercase tracking-wide text-navy-700/50">Hinweise</div>
                    {order.notes}
                  </div>
                ) : null}
              </div>

              <div className="mt-5">
                <OrderChat order={order} from="driver" authorName={user.name} onSent={refetch} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
