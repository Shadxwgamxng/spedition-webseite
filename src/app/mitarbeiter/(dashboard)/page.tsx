"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { employeeModules } from "@/lib/employee-nav";
import { StatCard } from "@/components/employee/page-header";
import { ArrowRightIcon } from "@/components/ui/icons";

const overviewStats = [
  { label: "Offene Aufträge", value: "23", hint: "in Disposition" },
  { label: "Fahrzeuge einsatzbereit", value: "112 / 119", hint: "7 in Wartung" },
  { label: "Offene Rechnungen", value: "€ 84.320", hint: "18 Rechnungen" },
  { label: "Lagerartikel unter Mindestbestand", value: "6", hint: "Inventur empfohlen" },
];

export default function EmployeeDashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <div className="mb-8">
        <div className="text-sm font-medium text-amber-600">Willkommen zurück</div>
        <h1 className="mt-1 text-2xl font-bold text-navy-900 sm:text-3xl">{user?.name}</h1>
        <p className="mt-1 text-sm text-navy-700/70">
          {user?.role} · {user?.department}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {overviewStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <h2 className="mb-4 mt-10 text-lg font-semibold text-navy-900">Systeme &amp; Module</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {employeeModules.map((mod) => (
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
