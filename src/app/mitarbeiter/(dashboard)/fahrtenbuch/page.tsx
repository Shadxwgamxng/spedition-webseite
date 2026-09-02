"use client";

import { useState, type FormEvent } from "react";
import { EmployeePageHeader, StatCard } from "@/components/employee/page-header";
import { Badge, Button } from "@/components/ui/primitives";

type Purpose = "Geschäftlich" | "Privat";

type Trip = {
  id: string;
  date: string;
  driver: string;
  vehicle: string;
  start: string;
  end: string;
  kmStart: number;
  kmEnd: number;
  purpose: Purpose;
};

const drivers = ["Lukas Schmidt", "Piotr Nowak", "Timo Fischer", "Anja Krüger", "Rafael Lindt"];
const vehicles = ["SN-BF 101", "SN-BF 102", "SN-BF 104", "SN-BF 112", "SN-BF 118", "SN-BF 122"];

const initialTrips: Trip[] = [
  { id: "FT-9001", date: "2026-09-01", driver: "Lukas Schmidt", vehicle: "SN-BF 101", start: "Falkenwalde", end: "Berlin", kmStart: 128100, kmEnd: 128450, purpose: "Geschäftlich" },
  { id: "FT-9002", date: "2026-09-01", driver: "Piotr Nowak", vehicle: "SN-BF 104", start: "Falkenwalde", end: "Danzig (PL)", kmStart: 41780, kmEnd: 42110, purpose: "Geschäftlich" },
  { id: "FT-9003", date: "2026-08-31", driver: "Timo Fischer", vehicle: "SN-BF 112", start: "Rostock", end: "Falkenwalde", kmStart: 210520, kmEnd: 210870, purpose: "Geschäftlich" },
  { id: "FT-9004", date: "2026-08-31", driver: "Anja Krüger", vehicle: "SN-BF 118", start: "Falkenwalde", end: "Greifswald", kmStart: 265120, kmEnd: 265400, purpose: "Geschäftlich" },
];

export default function FahrtenbuchPage() {
  const [trips, setTrips] = useState<Trip[]>(initialTrips);
  const [showForm, setShowForm] = useState(false);

  const totalKm = trips.reduce((sum, t) => sum + (t.kmEnd - t.kmStart), 0);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const kmStart = Number(form.get("kmStart"));
    const kmEnd = Number(form.get("kmEnd"));
    const trip: Trip = {
      id: `FT-${9000 + trips.length + 5}`,
      date: String(form.get("date")),
      driver: String(form.get("driver")),
      vehicle: String(form.get("vehicle")),
      start: String(form.get("start")),
      end: String(form.get("end")),
      kmStart,
      kmEnd: Math.max(kmEnd, kmStart),
      purpose: form.get("purpose") as Purpose,
    };
    setTrips((prev) => [trip, ...prev]);
    setShowForm(false);
    event.currentTarget.reset();
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

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Fahrten erfasst" value={String(trips.length)} />
        <StatCard label="Gesamt gefahrene km" value={`${totalKm.toLocaleString("de-DE")} km`} />
        <StatCard label="Aktive Fahrer" value={String(new Set(trips.map((t) => t.driver)).size)} />
        <StatCard label="Erfassung" value="lückenlos digital" tone="good" />
      </div>

      {showForm ? (
        <form
          onSubmit={handleSubmit}
          className="mt-6 grid grid-cols-1 gap-4 rounded-2xl border border-navy-900/8 bg-white p-6 shadow-sm shadow-navy-950/5 sm:grid-cols-2 lg:grid-cols-4"
        >
          <FormField label="Datum" name="date" type="date" required />
          <SelectField label="Fahrer" name="driver" options={drivers} />
          <SelectField label="Fahrzeug" name="vehicle" options={vehicles} />
          <SelectField label="Zweck" name="purpose" options={["Geschäftlich", "Privat"]} />
          <FormField label="Start" name="start" placeholder="z. B. Falkenwalde" required />
          <FormField label="Ziel" name="end" placeholder="z. B. Berlin" required />
          <FormField label="km-Stand Start" name="kmStart" type="number" required />
          <FormField label="km-Stand Ende" name="kmEnd" type="number" required />
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
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-900/6">
            {trips.map((t) => (
              <tr key={t.id}>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-navy-700/70">{t.id}</td>
                <td className="whitespace-nowrap px-4 py-3 text-navy-700/70">{new Date(t.date).toLocaleDateString("de-DE")}</td>
                <td className="px-4 py-3 font-medium text-navy-900">{t.driver}</td>
                <td className="px-4 py-3 font-mono text-xs text-navy-700/70">{t.vehicle}</td>
                <td className="px-4 py-3 text-navy-700/80">
                  {t.start} → {t.end}
                </td>
                <td className="px-4 py-3 text-navy-800">{(t.kmEnd - t.kmStart).toLocaleString("de-DE")} km</td>
                <td className="px-4 py-3">
                  <Badge tone={t.purpose === "Geschäftlich" ? "green" : "navy"}>{t.purpose}</Badge>
                </td>
              </tr>
            ))}
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
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
