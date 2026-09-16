import { listDriverPositions } from "@/lib/server/store";

/**
 * Positionen aller gerade eingestempelten Fahrer für die Live-Karte
 * (/mitarbeiter/live-karte), gepusht vom Tablet via /api/tablet/webhook
 * (Events 'driver_position.update'/'driver_position.remove', siehe
 * server/sv_tracking.lua im Tablet-Repo). Rein in-memory, kein db.json.
 */
export async function GET() {
  return Response.json({ drivers: listDriverPositions() });
}
