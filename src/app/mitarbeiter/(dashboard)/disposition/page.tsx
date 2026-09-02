"use client";

import { useMemo, useState } from "react";
import { EmployeePageHeader, StatCard } from "@/components/employee/page-header";
import { Badge } from "@/components/ui/primitives";

type OrderStatus = "Neu" | "Disponiert" | "Unterwegs" | "Zugestellt";

type Order = {
  id: string;
  customer: string;
  route: string;
  date: string;
  status: OrderStatus;
  driver: string;
  vehicle: string;
};

const drivers = ["— nicht zugewiesen —", "Lukas Schmidt", "Piotr Nowak", "Timo Fischer", "Anja Krüger", "Rafael Lindt"];
const vehicles = ["— nicht zugewiesen —", "SN-BF 101", "SN-BF 104", "SN-BF 112", "SN-BF 118", "SN-BF 122"];

const statusStyles: Record<OrderStatus, "navy" | "amber" | "green"> = {
  Neu: "navy",
  Disponiert: "amber",
  Unterwegs: "amber",
  Zugestellt: "green",
};

const initialOrders: Order[] = [
  { id: "BF-48213", customer: "Rathke Baustoffe GmbH", route: "Falkenwalde → Berlin", date: "2026-09-02", status: "Unterwegs", driver: "Lukas Schmidt", vehicle: "SN-BF 101" },
  { id: "BF-48214", customer: "Nordbalt Trading Sp. z o.o.", route: "Falkenwalde → Danzig (PL)", date: "2026-09-02", status: "Disponiert", driver: "Piotr Nowak", vehicle: "SN-BF 104" },
  { id: "BF-48215", customer: "Küstenlogistik Nord", route: "Falkenwalde → Hamburg", date: "2026-09-03", status: "Neu", driver: "— nicht zugewiesen —", vehicle: "— nicht zugewiesen —" },
  { id: "BF-48216", customer: "Berndt Frischwaren", route: "Falkenwalde → Rostock", date: "2026-09-02", status: "Zugestellt", driver: "Timo Fischer", vehicle: "SN-BF 112" },
  { id: "BF-48217", customer: "AgroTrans Pommern", route: "Stettin (PL) → Falkenwalde", date: "2026-09-03", status: "Neu", driver: "— nicht zugewiesen —", vehicle: "— nicht zugewiesen —" },
  { id: "BF-48218", customer: "Möbelhaus Greifswald", route: "Falkenwalde → Greifswald", date: "2026-09-03", status: "Disponiert", driver: "Anja Krüger", vehicle: "SN-BF 118" },
];

const statusOptions: OrderStatus[] = ["Neu", "Disponiert", "Unterwegs", "Zugestellt"];

export default function DispositionPage() {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [filter, setFilter] = useState<OrderStatus | "Alle">("Alle");

  const filtered = useMemo(
    () => (filter === "Alle" ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter],
  );

  const counts = useMemo(() => {
    const c: Record<OrderStatus, number> = { Neu: 0, Disponiert: 0, Unterwegs: 0, Zugestellt: 0 };
    orders.forEach((o) => c[o.status]++);
    return c;
  }, [orders]);

  function updateOrder(id: string, patch: Partial<Order>) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }

  return (
    <div>
      <EmployeePageHeader
        title="Disposition"
        description="Touren planen, Fahrer und Fahrzeuge zuweisen und den Status jeder Sendung im Blick behalten."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statusOptions.map((s) => (
          <StatCard key={s} label={s} value={String(counts[s])} />
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2">
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
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-navy-900/8 bg-mist-100 text-xs uppercase tracking-wide text-navy-700/60">
            <tr>
              <th className="px-4 py-3 font-medium">Auftrag</th>
              <th className="px-4 py-3 font-medium">Kunde</th>
              <th className="px-4 py-3 font-medium">Route</th>
              <th className="px-4 py-3 font-medium">Termin</th>
              <th className="px-4 py-3 font-medium">Fahrer</th>
              <th className="px-4 py-3 font-medium">Fahrzeug</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-900/6">
            {filtered.map((order) => (
              <tr key={order.id} className="align-middle">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-navy-900">{order.id}</td>
                <td className="px-4 py-3 text-navy-800">{order.customer}</td>
                <td className="px-4 py-3 text-navy-700/80">{order.route}</td>
                <td className="whitespace-nowrap px-4 py-3 text-navy-700/70">
                  {new Date(order.date).toLocaleDateString("de-DE")}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={order.driver}
                    onChange={(e) => updateOrder(order.id, { driver: e.target.value })}
                    className="rounded-lg border border-navy-900/15 bg-white px-2 py-1.5 text-xs"
                  >
                    {drivers.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={order.vehicle}
                    onChange={(e) => updateOrder(order.id, { vehicle: e.target.value })}
                    className="rounded-lg border border-navy-900/15 bg-white px-2 py-1.5 text-xs"
                  >
                    {vehicles.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={order.status}
                    onChange={(e) => updateOrder(order.id, { status: e.target.value as OrderStatus })}
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
          </tbody>
        </table>
      </div>
    </div>
  );
}
