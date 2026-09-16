import { getTabletLocations } from "@/lib/server/store";

/**
 * Gültige Standortnamen/Frachtarten aus dem Tablet (Config.Locations),
 * gepusht via /api/tablet/webhook (Event 'locations.sync'). Grundlage für
 * die Standort-/Frachtart-Auswahl bei "Neuer Auftrag" im Disposition-
 * Dashboard, wenn der Auftrag auch im Tablet ankommen soll.
 */
export async function GET() {
  const data = await getTabletLocations();
  return Response.json(data);
}
