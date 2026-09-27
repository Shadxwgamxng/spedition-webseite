import { getLiveMapBounds, listDriverPositions } from "@/lib/server/store";

/**
 * Positionen aller gerade eingestempelten Fahrer für die Live-Karte
 * (/mitarbeiter/live-karte), gepusht vom Tablet via /api/tablet/webhook
 * (Events 'driver_position.update'/'driver_position.remove', siehe
 * server/sv_tracking.lua im Tablet-Repo). Rein in-memory, kein db.json.
 * `bounds` kommt vom Tablet kalibriert (Event 'live_map.bounds') - ist
 * noch keins gepusht worden (z.B. Website noch nie mit einem laufenden
 * Tablet verbunden), liefert dieses Feld `null` und die Seite fällt auf
 * ihren eigenen Default zurück.
 */
export async function GET() {
  return Response.json({ drivers: listDriverPositions(), bounds: getLiveMapBounds() });
}
