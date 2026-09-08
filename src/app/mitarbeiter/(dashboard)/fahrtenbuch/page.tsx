"use client";

import { useState, type FormEvent } from "react";
import { EmployeePageHeader, StatCard } from "@/components/employee/page-header";
import { Badge, Button } from "@/components/ui/primitives";
import { usePolling } from "@/lib/use-polling";
import type { VehicleRecord } from "@/lib/fleet-data";

type Purpose = "Geschäftlich" | "Privat";

type Trip = {
  id: string;
  date: string;
  driverName: string;
  vehiclePlate: string;
  start: string;
  end: string;
  kmStart: number;
  kmEnd: number;
  purpose: Purpose;
};

type Employee = { username: string; name: string; roleKey: string };

export default function FahrtenbuchPage() {
  const { data: tripData, refetch } = usePolling<{ trips: Trip[] }>("/api/trips", 5000);
  const { data: employeeData } = usePolling<{ employees: Employee[] }>("/api/employees", 10000);
  const { data: vehicleData } = usePolling<{ vehicles: VehicleRecord[] }>("/api/vehicles", 10000);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trips = tripData?.trips ?? [];
  const drivers = (employeeData?.employees ?? []).filter((e) => e.roleKey === "fahrer").map((e) => e.name);
  const vehicles = (vehicleData?.vehicles ?? []).map((v) => v.plate);

  const totalKm = trips.reduce((sum, t) => sum + (t.kmEnd - t.kmStart), 0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const payload = {
      date: String(form.get("date") ?? ""),
      driverName: String(form.get("driverName") ?? ""),
      vehiclePlate: String(form.get("vehiclePlate") ?? ""),
      start: String(form.get("start") ?? ""),
      end: String(form.get("end") ?? ""),
      kmStart: Number(form.get("kmStart") ?? 0),
      kmEnd: Number(form.get("kmEnd") ?? 0),
      purpose: String(form.get("purpose") ?? "Geschäftlich"),
    };
    const res = await fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      setError(json.error ?? "Fahrt konnte nicht gespeichert werden.");
      return;
    }
    await refetch();
    setShowForm(false);
    event.currentTarget.reset();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/trips/${id}`, { method: "DELETE" });
    await refetch();
  }

  return (
    <div>
      <EmployeePageHeader
        title="Digitales Fahrtenbuch"
        description="Fahrten je Fahrer und Fahrzeug erfassen und Kilometerstände lückenlos dokumentieren."
        action={
          <Button icon={false} onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Formular schließen" : "Fahrt erfassen"}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Fahrten erfasst" value={String(trips.length)} />
        <StatCard label="Gesamt gefahrene km" value={`${totalKm.toLocaleString("de-DE")} km`} />
        <StatCard label="Aktive Fahrer" value={String(new Set(trips.map((t) => t.driverName)).size)} />
      </div>

      {showForm ? (
        <form
          onSubmit={handleSubmit}
          className="mt-6 grid grid-cols-1 gap-4 rounded-2xl border border-navy-900/8 bg-white p-6 shadow-sm shadow-navy-950/5 sm:grid-cols-2 lg:grid-cols-4"
        >
          <FormField label="Datum" name="date" type="date" required />
          <SelectField label="Fahrer" name="driverName" options={drivers} />
          <SelectField label="Fahrzeug" name="vehiclePlate" options={vehicles} />
          <SelectField label="Zweck" name="purpose" options={["Geschäftlich", "Privat"]} />
          <FormField label="Start" name="start" placeholder="z. B. Falkenwalde" required />
          <FormField label="Ziel" name="end" placeholder="z. B. Berlin" required />
          <FormField label="km-Stand Start" name="kmStart" type="number" required />
          <FormField label="km-Stand Ende" name="kmEnd" type="number" required />
          {error ? <p className="text-sm text-red-600 sm:col-span-2 lg:col-span-4">{error}</p> : null}
          <div className="sm:col-span-2 lg:col-span-4">
            <Button type="submit" icon={false}>
              Fahrt speichern
            </Button>
          </div>
        </form>
      ) : null}

      <div className="mt-4 overflow-x-auto rounded-2xl border border-navy-900/8 bg-white shadow-sm shadow-navy-950/5">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-navy-900/8 bg-mist-100 text-xs uppercase tracking-wide text-navy-700/60">
            <tr>
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Datum</th>
              <th className="px-4 py-3 font-medium">Fahrer</th>
              <th className="px-4 py-3 font-medium">Fahrzeug</th>
              <th className="px-4 py-3 font-medium">Strecke</th>
              <th className="px-4 py-3 font-medium">km</th>
              <th className="px-4 py-3 font-medium">Zweck</th>
              <th className="px-4 py-3 font-medium">&nbsp;</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-900/6">
            {trips.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-navy-700/60">
                  Noch keine Fahrten erfasst.
                </td>
              </tr>
            ) : (
              trips.map((t) => (
                <tr key={t.id}>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-navy-700/70">{t.id}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-navy-700/70">
                    {new Date(t.date).toLocaleDateString("de-DE")}
                  </td>
                  <td className="px-4 py-3 font-medium text-navy-900">{t.driverName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-navy-700/70">{t.vehiclePlate}</td>
                  <td className="px-4 py-3 text-navy-700/80">
                    {t.start} → {t.end}
                  </td>
                  <td className="px-4 py-3 text-navy-800">{(t.kmEnd - t.kmStart).toLocaleString("de-DE")} km</td>
                  <td className="px-4 py-3">
                    <Badge tone={t.purpose === "Geschäftlich" ? "green" : "navy"}>{t.purpose}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleDelete(t.id)}
                      className="text-xs font-semibold text-red-600 hover:text-red-700"
                    >
                      Löschen
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FormField({
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

function SelectField({ label, name, options }: { label: string; name: string; options: string[] }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-navy-800" htmlFor={name}>
        {label}
      </label>
      <select
        id={name}
        name={name}
        className="w-full rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm text-navy-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
      >
        {options.length === 0 ? <option value="">— keine verfügbar —</option> : null}
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
