"use client";

import { useState } from "react";

/** Deutsche Übersetzung der Lua-Fehlercodes, die ein Website→Tablet-Befehl
 * (assign_order/cancel_order/…) auf Auftrags-Aktionen werfen kann (siehe
 * server/sv_orders.lua) - ohne das kam bei einer Ablehnung (z.B. Auftrag im
 * Tablet bereits abgeschlossen, kein Fahrer am Fahrzeug angemeldet) auf der
 * Website überhaupt keine Rückmeldung an, der Button wirkte dadurch einfach
 * wirkungslos statt den tatsächlichen Grund zu zeigen. */
const TABLET_ORDER_ERRORS: Record<string, string> = {
  order_not_found: "Auftrag wurde im Tablet nicht gefunden (evtl. durch einen Neustart entfernt).",
  order_already_closed: "Auftrag ist im Tablet bereits abgeschlossen, abgebrochen oder abgelehnt.",
  order_not_open: "Auftrag ist im Tablet nicht mehr offen (wurde zwischenzeitlich schon disponiert) — Seite aktualisieren.",
  no_vehicle_selected: "Kein Fahrzeug ausgewählt.",
  vehicle_not_found: "Das gewählte Fahrzeug existiert im Tablet nicht (mehr).",
  vehicle_archived: "Das gewählte Fahrzeug ist im Tablet archiviert.",
  vehicle_unavailable: "Das gewählte Fahrzeug ist im Tablet aktuell nicht verfügbar (z. B. in der Werkstatt).",
  vehicle_missing_trailer: "Am gewählten Fahrzeug hängt im Tablet kein zur Fracht passender Anhänger.",
  driver_not_found: "Am gewählten Fahrzeug ist im Tablet aktuell kein aktiver Fahrer angemeldet.",
  driver_missing_permission: "Der Fahrer hat im Tablet nicht die nötige Führerscheinklasse für diese Fracht.",
  invalid_command_payload: "Ungültige Daten wurden an das Tablet übermittelt.",
};

export function translateOrderCommandError(error?: string): string {
  if (!error) return "Unbekannter Fehler.";
  return TABLET_ORDER_ERRORS[error] ?? error;
}

type TabletCommandResult = { ok: boolean; error?: string } | null;

/** Pollt den Status eines Website→Tablet-Befehls, bis das Tablet ihn
 * bestätigt hat (typischerweise binnen weniger Sekunden, siehe
 * Config.Website.pollIntervalMs) oder das Zeitlimit erreicht ist. `null` =
 * keine Rückmeldung binnen des Zeitlimits (Tablet nicht erreichbar/
 * Config.Website dort nicht aktiv). */
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

/**
 * Schickt Dispositionsaktionen (assign_order/cancel_order/create_order/…) an
 * die Website→Tablet-Befehlswarteschlange und wartet auf die Bestätigung aus
 * dem Spiel, statt nur eine lokale `db.json`-Kopie zu ändern (siehe README
 * "Tablet-Sync"). Gemeinsam genutzt von Disposition und Auftragspool, die
 * beide Aktionen auf `origin: "tablet"`-Aufträgen auslösen.
 */
export function useTabletCommand(onSettled?: () => Promise<void> | void) {
  const [commandNotice, setCommandNotice] = useState<string | null>(null);

  async function enqueueTabletCommand(type: string, data: Record<string, unknown>): Promise<TabletCommandResult> {
    setCommandNotice("Befehl wird an das Tablet gesendet…");
    try {
      const res = await fetch("/api/tablet/commands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, data }),
      });
      const json = await res.json().catch(() => null);
      const commandId = json?.command?.id as string | undefined;
      if (!commandId) {
        setCommandNotice("Befehl konnte nicht an die Website-Warteschlange übergeben werden.");
        return null;
      }
      const result = await pollCommandResult(commandId);
      if (result === null) {
        setCommandNotice(
          "Keine Rückmeldung vom Tablet innerhalb von 30s — läuft die Ressource, und ist Config.Website dort aktiv?",
        );
      } else if (result.ok) {
        setCommandNotice(null);
      } else {
        setCommandNotice(`Aktion im Tablet fehlgeschlagen: ${translateOrderCommandError(result.error)}`);
      }
      return result;
    } finally {
      await onSettled?.();
    }
  }

  return { commandNotice, enqueueTabletCommand };
}
