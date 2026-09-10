"use client";

import { useState, type FormEvent } from "react";
import { usePolling } from "@/lib/use-polling";
import { Button } from "@/components/ui/primitives";
import { CheckIcon } from "@/components/ui/icons";
import { roleKeys, roleLabels, type RoleKey } from "@/lib/roles";
import type { EmployeeUser } from "@/lib/auth";

type Employee = EmployeeUser & { id: string };

const NEW = "__new__";

export function EmployeeManager() {
  const { data, refetch } = usePolling<{ employees: Employee[] }>("/api/employees", 6000);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const employees = data?.employees ?? [];
  const editingEmployee = editingId && editingId !== NEW ? employees.find((e) => e.id === editingId) : null;
  const isNew = editingId === NEW;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = {
      username: String(form.get("username") ?? ""),
      discordId: String(form.get("discordId") ?? ""),
      discordUsername: String(form.get("discordUsername") ?? ""),
      name: String(form.get("name") ?? ""),
      roleKey: String(form.get("roleKey") ?? ""),
      department: String(form.get("department") ?? ""),
    };

    try {
      const res = await fetch(isNew ? "/api/employees" : `/api/employees/${editingId}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) {
        setError(json.error ?? "Speichern fehlgeschlagen.");
        return;
      }
      if (isNew) {
        setNotice(
          json.discordDm?.ok
            ? "Konto angelegt — Discord-DM mit Login-Link wurde verschickt."
            : `Konto angelegt, aber Discord-DM konnte nicht verschickt werden: ${json.discordDm?.error ?? "unbekannter Fehler"}`,
        );
      }
      await refetch();
      setEditingId(null);
    } catch {
      setError("Verbindung zum Server fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/employees/${id}`, { method: "DELETE" });
      await refetch();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="text-sm text-navy-700/60">{employees.length} Mitarbeiter-Konten</div>
        <Button icon={false} onClick={() => setEditingId(editingId ? null : NEW)}>
          {editingId ? "Formular schließen" : "Konto anlegen"}
        </Button>
      </div>

      {notice ? (
        <p className="mt-3 rounded-xl border border-navy-900/8 bg-mist-50 px-4 py-2.5 text-sm text-navy-700">
          {notice}
        </p>
      ) : null}

      {editingId ? (
        <form
          onSubmit={handleSubmit}
          className="mt-4 grid grid-cols-1 gap-3 rounded-2xl border border-navy-900/8 bg-white p-5 shadow-sm shadow-navy-950/5 sm:grid-cols-2"
        >
          <div>
            <label className="mb-1.5 block text-xs font-medium text-navy-800" htmlFor="username">
              Benutzername (intern)
            </label>
            <input
              id="username"
              name="username"
              required
              defaultValue={editingEmployee?.username ?? ""}
              className="w-full rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-navy-800" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              name="name"
              required
              defaultValue={editingEmployee?.name ?? ""}
              className="w-full rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-navy-800" htmlFor="discordId">
              Discord-Nutzer-ID
              <span className="ml-1 font-normal text-navy-700/50">(erforderlich zum Einloggen)</span>
            </label>
            <input
              id="discordId"
              name="discordId"
              required
              inputMode="numeric"
              placeholder="z. B. 123456789012345678"
              defaultValue={editingEmployee?.discordId ?? ""}
              className="w-full rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm font-mono outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-navy-800" htmlFor="discordUsername">
              Discord-Benutzername
              <span className="ml-1 font-normal text-navy-700/50">(nur zur Anzeige)</span>
            </label>
            <input
              id="discordUsername"
              name="discordUsername"
              placeholder="z. B. lucas.ehlers"
              defaultValue={editingEmployee?.discordUsername ?? ""}
              className="w-full rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-navy-800" htmlFor="roleKey">
              Rolle (feste Berechtigungen)
            </label>
            <select
              id="roleKey"
              name="roleKey"
              defaultValue={editingEmployee?.roleKey ?? ("disponent" satisfies RoleKey)}
              className="w-full rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            >
              {roleKeys.map((key) => (
                <option key={key} value={key}>
                  {roleLabels[key]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-navy-800" htmlFor="department">
              Abteilung
            </label>
            <input
              id="department"
              name="department"
              required
              defaultValue={editingEmployee?.department ?? ""}
              placeholder="z. B. Disposition, Lager, Fahrbetrieb …"
              className="w-full rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <p className="text-xs text-navy-700/50 sm:col-span-2">
            Die Discord-Nutzer-ID findet dein Mitarbeiter in seinen Discord-Einstellungen unter &bdquo;Erweitert&ldquo; →
            &bdquo;Entwicklermodus&ldquo; aktivieren, dann Rechtsklick auf den eigenen Namen → &bdquo;Nutzer-ID kopieren&ldquo;.
          </p>

          {error ? <p className="text-sm text-red-600 sm:col-span-2">{error}</p> : null}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-navy-950 hover:bg-amber-400 disabled:opacity-60"
            >
              <CheckIcon className="h-4 w-4" />
              {saving ? "Speichert…" : "Speichern"}
            </button>
          </div>
        </form>
      ) : null}

      <div className="mt-4 space-y-2">
        {employees.length === 0 ? (
          <p className="rounded-2xl border border-navy-900/8 bg-white p-6 text-sm text-navy-700/60">
            Noch keine Mitarbeiter-Konten.
          </p>
        ) : (
          employees.map((employee) => (
            <div
              key={employee.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-navy-900/8 bg-white px-4 py-3"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-navy-900">
                  {employee.name} <span className="font-mono text-xs font-normal text-navy-700/50">({employee.username})</span>
                </div>
                <div className="truncate text-xs text-navy-700/60">
                  {employee.role} · {employee.department}
                </div>
                <div className="truncate text-xs text-navy-700/50">
                  {employee.discordId ? (
                    <>Discord: {employee.discordUsername || employee.discordId}</>
                  ) : (
                    <span className="text-amber-600">Noch nicht mit Discord verknüpft — Login nicht möglich</span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditingId(employee.id)}
                  className="text-xs font-semibold text-navy-700 hover:text-navy-900"
                >
                  Bearbeiten
                </button>
                <button
                  type="button"
                  disabled={deletingId === employee.id}
                  onClick={() => handleDelete(employee.id)}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  {deletingId === employee.id ? "Löscht…" : "Löschen"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
