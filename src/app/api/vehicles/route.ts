import { createVehicle, getVehicles } from "@/lib/server/store";
import type { MaintenanceStatus } from "@/lib/fleet-data";

const VALID_STATUSES: MaintenanceStatus[] = ["Einsatzbereit", "In Werkstatt", "TÜV fällig"];

export async function GET() {
  const vehicles = await getVehicles();
  return Response.json({ vehicles });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const plate = typeof body?.plate === "string" ? body.plate.trim() : "";
  const type = typeof body?.type === "string" ? body.type.trim() : "";
  const year = Number(body?.year);
  const mileage = Number(body?.mileage);
  const nextService = typeof body?.nextService === "string" ? body.nextService : "";
  const nextTuv = typeof body?.nextTuv === "string" ? body.nextTuv : "";
  const maintenanceStatus = VALID_STATUSES.includes(body?.maintenanceStatus)
    ? (body.maintenanceStatus as MaintenanceStatus)
    : "Einsatzbereit";

  if (!plate || !type || !nextService || !nextTuv || !Number.isFinite(year) || !Number.isFinite(mileage)) {
    return Response.json(
      { ok: false, error: "Kennzeichen, Typ, Baujahr, Kilometerstand, Wartungs- und TÜV-Termin sind erforderlich." },
      { status: 400 },
    );
  }

  try {
    const vehicle = await createVehicle({ plate, type, year, mileage, nextService, nextTuv, maintenanceStatus });
    return Response.json({ ok: true, vehicle }, { status: 201 });
  } catch (err) {
    return Response.json({ ok: false, error: err instanceof Error ? err.message : "Fehler beim Anlegen." }, { status: 409 });
  }
}
