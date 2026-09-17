"use client";

import { useState, type FormEvent } from "react";
import { usePolling } from "@/lib/use-polling";
import { Button } from "@/components/ui/primitives";
import { CheckIcon } from "@/components/ui/icons";
import { roleKeys, roleLabels, driverLicenseKeys, driverLicenseLabels, type RoleKey } from "@/lib/roles";
import type { EmployeeUser } from "@/lib/auth";

type Employee = EmployeeUser & {
  id: string;
  /** Set when this account is synced from the FiveM Speditions-Tablet (see README "Tablet-Sync") — role changes then come from there, not this form. */
  tabletEmployeeId?: number | null;
  status?: "aktiv" | "inaktiv";
  driverLicenses?: string[];
};

const NEW = "__new__";

/** Deutsche Übersetzung der Lua-Fehlercodes, die Employees.HireFromWebsite
 * auf Tablet-Seite werfen kann (server/sv_employees.lua) - ohne das würde
 * dem Nutzer nur der rohe Fehlerstring angezeigt. */
const TABLET_COMMAND_ERRORS: Record<string, string> = {
  no_tablet_role_mapped_to_website_role:
    "Keine Tablet-Rolle ist dieser Website-Rolle zugeordnet - im Tablet unter Reiter „Rollen“ bei genau einer Rolle die passende Website-Rolle eintragen, dann Konto erneut anlegen.",
  ambiguous_tablet_role_mapping:
    "Mehrere Tablet-Rollen sind derselben Website-Rolle zugeordnet - im Tablet unter Reiter „Rollen“ muss das eindeutig sein (nur eine Tablet-Rolle pro Website-Rolle).",
  employee_already_exists: "Dieser Benutzername ist im Tablet bereits vergeben - anderen Benutzernamen wählen.",
  missing_fields: "Es fehlten Pflichtfelder beim Anlegen im Tablet.",
};

function translateTabletCommandError(error: string | undefined): string {
  if (!error) return "Unbekannter Fehler.";
  return TABLET_COMMAND_ERRORS[error] ?? error;
}

type TabletCommandResult = { ok: boolean; error?: string } | null;

/** Pollt den Status eines Website→Tablet-Befehls, bis das Tablet ihn
 * bestätigt hat (typischerweise binnen weniger Sekunden, siehe
 * Config.Website.pollIntervalMs) oder das Zeitlimit erreicht ist - damit ein
 * fehlgeschlagener create_employee-Befehl (z.B. Rollen-Zuordnung im Tablet
 * nicht eindeutig) sichtbar wird, statt dass es nur beim erfolglosen
 * Ingame-Login auffällt. `null` = keine Rückmeldung binnen des Zeitlimits
 * (Tablet nicht erreichbar/Config.Website nicht aktiv). */
async function pollCommandResult(id: string, timeoutMs = 30000, intervalMs = 2000): Promise<TabletCommandResult> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, intervalMs));
    try {
      const res = await fetch(`/api/tablet/commands/${id}`);
      const json = await res.json();
      if (json?.ok && json.command?.resolvedAt) return json.command.result as TabletCommandResult;
    } catch {
      // nächster Poll-Versuch
    }
  }
  return null;
}

export function EmployeeManager() {
  const { data, refetch } = usePolling<{ employees: Employee[] }>("/api/employees", 6000);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [alsoInTablet, setAlsoInTablet] = useState(false);

  const employees = data?.employees ?? [];
  const editingEmployee = editingId && editingId !== NEW ? employees.find((e) => e.id === editingId) : null;
  const isNew = editingId === NEW;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const driverLicenses = form.getAll("driverLicenses").map(String);
    const payload: Record<string, unknown> = {
      username: String(form.get("username") ?? ""),
      discordId: String(form.get("discordId") ?? ""),
      discordUsername: String(form.get("discordUsername") ?? ""),
      name: String(form.get("name") ?? ""),
      department: String(form.get("department") ?? ""),
      driverLicenses,
    };
    // roleKey ist bei einem Tablet-verknüpften Konto ausgegraut (die Rolle
    // wird dort verwaltet) — ein disabled <select> liefert keinen Wert in
    // FormData, also roleKey hier ganz weglassen statt eine leere Rolle
    // mitzuschicken (würde die Speicherung sonst mit "Ungültige Rolle."
    // ablehnen).
    if (!editingEmployee?.tabletEmployeeId) {
      payload.roleKey = String(form.get("roleKey") ?? "");
    }

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
        const websitePart = json.discordDm?.ok
          ? "Konto angelegt — Discord-DM mit Login-Link wurde verschickt."
          : `Konto angelegt, aber Discord-DM konnte nicht verschickt werden: ${json.discordDm?.error ?? "unbekannter Fehler"}`;

        // Soll auch ein Tablet-Login entstehen: eigener Befehl an die
        // Befehls-Queue (Employees.HireFromWebsite auf Tablet-Seite sucht
        // dort die passende Tablet-Rolle über die Website-Rolle) - schlägt
        // dort fehl, wenn noch keine (eindeutige) Tablet-Rolle im
        // Rollen-Editor zugeordnet ist. Auf das Befehls-Ack wird hier aktiv
        // gewartet (statt es stillschweigend zu ignorieren), damit ein
        // Fehlschlag sofort sichtbar ist statt erst beim erfolglosen
        // Ingame-Login.
        if (alsoInTablet) {
          setNotice(`${websitePart} Warte auf Rückmeldung vom Tablet…`);
          const commandRes = await fetch("/api/tablet/commands", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "create_employee",
              data: {
                username: payload.username,
                password: form.get("tabletPassword"),
                name: payload.name,
                websiteRoleKey: payload.roleKey,
                discordId: payload.discordId,
                driverPermissions: driverLicenses,
              },
            }),
          });
          const commandJson = await commandRes.json().catch(() => null);
          const commandId = commandJson?.command?.id as string | undefined;
          const result = commandId ? await pollCommandResult(commandId) : null;
          if (result === null) {
            setNotice(
              `${websitePart} Tablet-Login: keine Rückmeldung innerhalb von 30s - läuft die Ressource, und ist Config.Website im Tablet aktiv?`,
            );
          } else if (result.ok) {
            setNotice(`${websitePart} Tablet-Login wurde erfolgreich eingerichtet.`);
          } else {
            setNotice(`${websitePart} Tablet-Login konnte NICHT angelegt werden: ${translateTabletCommandError(result.error)}`);
          }
        } else {
          setNotice(websitePart);
        }
      } else if (editingEmployee?.tabletEmployeeId) {
        // Bereits Tablet-verknüpftes Konto: Änderung an den Führerschein-
        // klassen als eigener Befehl an die Queue - Drivers.SetPermissionsFromWebsite
        // auf Tablet-Seite ersetzt dort die komplette Liste (voller Abgleich,
        // kein inkrementelles Hinzufügen), das Ergebnis kommt asynchron per
        // Befehls-Ack zurück, nicht als Antwort auf dieses Formular.
        await fetch("/api/tablet/commands", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "update_driver_permissions",
            data: { tabletEmployeeId: editingEmployee.tabletEmployeeId, permissions: driverLicenses },
          }),
        });
      }
      await refetch();
      setEditingId(null);
      setAlsoInTablet(false);
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
              disabled={Boolean(editingEmployee?.tabletEmployeeId)}
              defaultValue={editingEmployee?.roleKey ?? ("disponent" satisfies RoleKey)}
              className="w-full rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:bg-mist-100 disabled:text-navy-700/60"
            >
              {roleKeys.map((key) => (
                <option key={key} value={key}>
                  {roleLabels[key]}
                </option>
              ))}
            </select>
            {editingEmployee?.tabletEmployeeId ? (
              <p className="mt-1 text-xs text-navy-700/50">
                Verknüpft mit Tablet-Konto #{editingEmployee.tabletEmployeeId} — die Rolle wird dort verwaltet.
              </p>
            ) : null}
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

          <div className="sm:col-span-2">
            <span className="mb-1.5 block text-xs font-medium text-navy-800">Führerscheinklassen</span>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {driverLicenseKeys.map((key) => (
                <label key={key} className="flex items-center gap-1.5 text-xs text-navy-800">
                  <input
                    type="checkbox"
                    name="driverLicenses"
                    value={key}
                    defaultChecked={editingEmployee?.driverLicenses?.includes(key) ?? false}
                    className="h-4 w-4 rounded border-navy-900/25"
                  />
                  {driverLicenseLabels[key]}
                </label>
              ))}
            </div>
            {editingEmployee?.tabletEmployeeId ? (
              <p className="mt-1 text-xs text-navy-700/50">
                Änderungen werden an das verknüpfte Tablet-Konto #{editingEmployee.tabletEmployeeId} übertragen.
              </p>
            ) : null}
          </div>

          <p className="text-xs text-navy-700/50 sm:col-span-2">
            Die Discord-Nutzer-ID findet dein Mitarbeiter in seinen Discord-Einstellungen unter &bdquo;Erweitert&ldquo; →
            &bdquo;Entwicklermodus&ldquo; aktivieren, dann Rechtsklick auf den eigenen Namen → &bdquo;Nutzer-ID kopieren&ldquo;.
          </p>

          {isNew ? (
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-xs font-medium text-navy-800">
                <input
                  type="checkbox"
                  checked={alsoInTablet}
                  onChange={(e) => setAlsoInTablet(e.target.checked)}
                  className="h-4 w-4 rounded border-navy-900/25"
                />
                Auch ein Tablet-Login (im Spiel) für diese Person anlegen
              </label>
              {alsoInTablet ? (
                <div className="mt-2">
                  <label className="mb-1.5 block text-xs font-medium text-navy-800" htmlFor="tabletPassword">
                    Tablet-Passwort
                    <span className="ml-1 font-normal text-navy-700/50">
                      (nur fürs Tablet-Login im Spiel — wird auf der Website nicht gespeichert/verwendet)
                    </span>
                  </label>
                  <input
                    id="tabletPassword"
                    name="tabletPassword"
                    type="text"
                    required={alsoInTablet}
                    className="w-full max-w-sm rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                  <p className="mt-1 text-xs text-navy-700/50">
                    Erfordert, dass die gewählte Rolle im Tablet-Rollen-Editor eindeutig zugeordnet ist — sonst
                    schlägt das Anlegen im Spiel fehl (Konto auf der Website wird trotzdem angelegt).
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

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
                  {employee.status === "inaktiv" ? (
                    <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700">
                      Inaktiv
                    </span>
                  ) : null}
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
                {employee.tabletEmployeeId ? (
                  <div className="truncate text-xs text-navy-700/50">🎮 Verknüpft mit Tablet-Konto #{employee.tabletEmployeeId}</div>
                ) : null}
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
