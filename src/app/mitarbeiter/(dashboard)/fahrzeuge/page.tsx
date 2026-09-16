"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { EmployeePageHeader, StatCard } from "@/components/employee/page-header";
import { Badge, Button } from "@/components/ui/primitives";
import { usePolling } from "@/lib/use-polling";
import type { MaintenanceStatus, VehicleRecord } from "@/lib/fleet-data";

type VehiclesResponse = { vehicles: VehicleRecord[] };

const statusTone: Record<MaintenanceStatus, "green" | "amber" | "navy"> = {
  Einsatzbereit: "green",
  "In Werkstatt": "amber",
  "TÜV fällig": "amber",
};

const statusOptions: MaintenanceStatus[] = ["Einsatzbereit", "In Werkstatt", "TÜV fällig"];

export default function FahrzeugePage() {
  const { user } = useAuth();
  const { data, refetch } = usePolling<VehiclesResponse>("/api/vehicles", 5000);
  const [filter, setFilter] = useState<MaintenanceStatus | "Alle">("Alle");
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingPlate, setEditingPlate] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<MaintenanceStatus>("Einsatzbereit");
  const [editMileage, setEditMileage] = useState(0);
  const [saving, setSaving] = useState(false);

  const canManage = user?.roleKey === "geschaeftsfuehrung";
  const vehicles = useMemo(() => data?.vehicles ?? [], [data]);

  const filtered = useMemo(
    () => (filter === "Alle" ? vehicles : vehicles.filter((v) => v.maintenanceStatus === filter)),
    [vehicles, filter],
  );

  const readyCount = vehicles.filter((v) => v.maintenanceStatus === "Einsatzbereit").length;
  const attentionCount = vehicles.filter((v) => v.maintenanceStatus !== "Einsatzbereit").length;
  const activeCount = vehicles.filter((v) => v.activeDriver).length;

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plate: form.get("plate"),
          type: form.get("type"),
          year: Number(form.get("year")),
          mileage: Number(form.get("mileage")),
          nextService: form.get("nextService"),
          nextTuv: form.get("nextTuv"),
          maintenanceStatus: form.get("maintenanceStatus"),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setFormError(json.error ?? "Fahrzeug konnte nicht angelegt werden.");
        return;
      }
      await refetch();
      setShowForm(false);
      event.currentTarget.reset();
    } catch {
      setFormError("Verbindung zum Server fehlgeschlagen.");
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(v: VehicleRecord) {
    setEditingPlate(v.plate);
    setEditStatus(v.maintenanceStatus);
    setEditMileage(v.mileage);
  }

  // Fahrzeuge mit tabletVehicleId kommen aus dem Speditions-Tablet im Spiel
  // (oder wurden dorthin bereits übertragen) - eine Bearbeitung hier wird
  // zusätzlich als update_vehicle-Befehl an das Tablet gemeldet (siehe
  // store.ts, updateVehicle), damit keine Seite die andere überstimmt.
  async function saveEdit(plate: string) {
    setSaving(true);
    try {
      await fetch(`/api/vehicles/${encodeURIComponent(plate)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maintenanceStatus: editStatus, mileage: editMileage }),
      });
      await refetch();
      setEditingPlate(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(plate: string) {
    setDeleting(plate);
    try {
      await fetch(`/api/vehicles/${encodeURIComponent(plate)}`, { method: "DELETE" });
      await refetch();
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      <EmployeePageHeader
        title="Fahrzeugverwaltung"
        description="Fuhrpark, Laufleistungen sowie Wartungs- und Prüftermine im Überblick."
        action={
          canManage ? (
            <Button icon={false} onClick={() => setShowForm((v) => !v)}>
              {showForm ? "Formular schließen" : "Fahrzeug anlegen"}
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Fahrzeuge gesamt" value={String(vehicles.length)} />
        <StatCard label="Einsatzbereit" value={String(readyCount)} tone="good" />
        <StatCard label="Werkstatt / TÜV fällig" value={String(attentionCount)} tone={attentionCount ? "warn" : "good"} />
        <StatCard label="Gerade im Einsatz" value={String(activeCount)} hint="Fahrer angemeldet" />
      </div>

      {canManage && showForm ? (
        <form
          onSubmit={handleCreate}
          className="mt-6 grid grid-cols-1 gap-3 rounded-2xl border border-navy-900/8 bg-white p-5 shadow-sm shadow-navy-950/5 sm:grid-cols-2 lg:grid-cols-4"
        >
          <Field label="Kennzeichen" name="plate" placeholder="z. B. SN-BF 130" required />
          <Field label="Typ" name="type" placeholder="z. B. Sattelzugmaschine Euro 6" required />
          <Field label="Baujahr" name="year" type="number" required />
          <Field label="Kilometerstand" name="mileage" type="number" required />
          <Field label="Nächste Wartung" name="nextService" type="date" required />
          <Field label="Nächster TÜV" name="nextTuv" type="date" required />
          <div>
            <label className="mb-1.5 block text-xs font-medium text-navy-800" htmlFor="maintenanceStatus">
              Status
            </label>
            <select
              id="maintenanceStatus"
              name="maintenanceStatus"
              defaultValue="Einsatzbereit"
              className="w-full rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          {formError ? <p className="text-sm text-red-600 sm:col-span-2 lg:col-span-4">{formError}</p> : null}
          <div className="sm:col-span-2 lg:col-span-4">
            <Button type="submit" icon={false} className={submitting ? "opacity-60" : ""}>
              {submitting ? "Wird angelegt…" : "Fahrzeug speichern"}
            </Button>
          </div>
        </form>
      ) : null}

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
              <th className="px-4 py-3 font-medium">Kennzeichen</th>
              <th className="px-4 py-3 font-medium">Typ</th>
              <th className="px-4 py-3 font-medium">Baujahr</th>
              <th className="px-4 py-3 font-medium">Kilometerstand</th>
              <th className="px-4 py-3 font-medium">Nächste Wartung</th>
              <th className="px-4 py-3 font-medium">Nächster TÜV</th>
              <th className="px-4 py-3 font-medium">Aktuell gefahren von</th>
              <th className="px-4 py-3 font-medium">Status</th>
              {canManage ? <th className="px-4 py-3 font-medium">&nbsp;</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-900/6">
            {filtered.map((v) => {
              const editing = editingPlate === v.plate;
              return (
                <tr key={v.plate}>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-navy-900">
                    {v.plate}
                    {v.tabletVehicleId ? (
                      <span className="ml-2 rounded-full bg-navy-900/5 px-2 py-0.5 text-[10px] font-semibold text-navy-700/70">
                        🎮 Tablet
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-navy-800">{v.type}</td>
                  <td className="px-4 py-3 text-navy-700/70">{v.year}</td>
                  <td className="px-4 py-3 text-navy-700/70">
                    {editing ? (
                      <input
                        type="number"
                        value={editMileage}
                        onChange={(e) => setEditMileage(Number(e.target.value))}
                        className="w-28 rounded-lg border border-navy-900/15 bg-white px-2 py-1 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                      />
                    ) : (
                      `${v.mileage.toLocaleString("de-DE")} km`
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-navy-700/70">
                    {new Date(v.nextService).toLocaleDateString("de-DE")}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-navy-700/70">
                    {new Date(v.nextTuv).toLocaleDateString("de-DE")}
                  </td>
                  <td className="px-4 py-3">
                    {v.activeDriver ? (
                      <Badge tone="green">{v.activeDriver}</Badge>
                    ) : (
                      <span className="text-navy-700/40">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editing ? (
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as MaintenanceStatus)}
                        className="rounded-lg border border-navy-900/15 bg-white px-2 py-1 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                      >
                        {statusOptions.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Badge tone={statusTone[v.maintenanceStatus]}>{v.maintenanceStatus}</Badge>
                    )}
                  </td>
                  {canManage ? (
                    <td className="whitespace-nowrap px-4 py-3">
                      {editing ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => saveEdit(v.plate)}
                            className="text-xs font-semibold text-navy-900 hover:text-amber-600 disabled:opacity-50"
                          >
                            {saving ? "Speichert…" : "Speichern"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPlate(null)}
                            className="text-xs font-semibold text-navy-700/60 hover:text-navy-900"
                          >
                            Abbrechen
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => startEdit(v)}
                            className="text-xs font-semibold text-navy-900 hover:text-amber-600"
                          >
                            Bearbeiten
                          </button>
                          <button
                            type="button"
                            disabled={deleting === v.plate}
                            onClick={() => handleDelete(v.plate)}
                            className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                          >
                            {deleting === v.plate ? "Löscht…" : "Löschen"}
                          </button>
                        </div>
                      )}
                    </td>
                  ) : null}
                </tr>
              );
            })}
            {filtered.length === 0 && data ? (
              <tr>
                <td colSpan={canManage ? 9 : 8} className="px-4 py-8 text-center text-sm text-navy-700/50">
                  Keine Fahrzeuge in dieser Ansicht.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
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
