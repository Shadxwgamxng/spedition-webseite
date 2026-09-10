"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { employeeModules } from "@/lib/employee-nav";
import { canAccessModule } from "@/lib/roles";
import { StatCard } from "@/components/employee/page-header";
import { VehicleLoginWidget } from "@/components/employee/vehicle-login-widget";
import { usePolling } from "@/lib/use-polling";
import { ArrowRightIcon } from "@/components/ui/icons";
import type { OrderRecord, VehicleRecord } from "@/lib/fleet-data";

export default function EmployeeDashboardPage() {
  const { user } = useAuth();
  const { data: orderData } = usePolling<{ orders: OrderRecord[] }>("/api/orders", 5000);
  const { data: vehicleData } = usePolling<{ vehicles: VehicleRecord[] }>("/api/vehicles", 5000);

  if (!user) return null;

  const visibleModules = employeeModules.filter((mod) => canAccessModule(user.roleKey, mod.key));
  const isFahrer = user.roleKey === "fahrer";

  const orders = orderData?.orders ?? [];
  const openOrders = orders.filter((o) => o.status !== "Zugestellt" && o.status !== "Abgelehnt");
  const requestedOrders = orders.filter((o) => o.status === "Angefragt");

  const vehicles = vehicleData?.vehicles ?? [];
  const readyVehicles = vehicles.filter((v) => v.maintenanceStatus === "Einsatzbereit");
  const inServiceVehicles = vehicles.filter((v) => v.maintenanceStatus !== "Einsatzbereit");

  return (
    <div>
      <div className="mb-8">
        <div className="text-sm font-medium text-amber-600">Willkommen zurück</div>
        <h1 className="mt-1 text-2xl font-bold text-navy-900 sm:text-3xl">{user.name}</h1>
        <p className="mt-1 text-sm text-navy-700/70">
          {user.role} · {user.department}
        </p>
      </div>

      {!isFahrer ? (
        <>
          <VehicleLoginWidget driverName={user.name} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard
              label="Offene Aufträge"
              value={orderData ? String(openOrders.length) : "…"}
              hint={requestedOrders.length > 0 ? `${requestedOrders.length} neue Anfrage(n)` : undefined}
            />
            <StatCard
              label="Fahrzeuge einsatzbereit"
              value={vehicleData ? `${readyVehicles.length} / ${vehicles.length}` : "…"}
              hint={inServiceVehicles.length > 0 ? `${inServiceVehicles.length} in Werkstatt/TÜV fällig` : undefined}
            />
          </div>
        </>
      ) : null}

      <h2 className="mb-4 mt-10 text-lg font-semibold text-navy-900">
        {isFahrer ? "Deine Bereiche" : "Systeme & Module"}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleModules.map((mod) => (
          <Link
            key={mod.href}
            href={mod.href}
            className="group flex flex-col rounded-2xl border border-navy-900/8 bg-white p-5 shadow-sm shadow-navy-950/5 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900 text-amber-400">
              <mod.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-3 font-semibold text-navy-900 group-hover:text-amber-700">{mod.label}</h3>
            <p className="mt-1 flex-1 text-sm text-navy-700/65">{mod.description}</p>
            <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-600">
              Öffnen <ArrowRightIcon className="h-4 w-4" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
