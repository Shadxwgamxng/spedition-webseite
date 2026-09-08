import { createTrip, getTrips } from "@/lib/server/store";

const VALID_PURPOSES = ["Geschäftlich", "Privat"];

export async function GET() {
  const trips = await getTrips();
  return Response.json({ trips });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const date = typeof body?.date === "string" ? body.date : "";
  const driverName = typeof body?.driverName === "string" ? body.driverName.trim() : "";
  const vehiclePlate = typeof body?.vehiclePlate === "string" ? body.vehiclePlate.trim() : "";
  const start = typeof body?.start === "string" ? body.start.trim() : "";
  const end = typeof body?.end === "string" ? body.end.trim() : "";
  const kmStart = Number(body?.kmStart);
  const kmEnd = Number(body?.kmEnd);
  const purpose = VALID_PURPOSES.includes(body?.purpose) ? body.purpose : "Geschäftlich";

  if (!date || !driverName || !vehiclePlate || !start || !end || !Number.isFinite(kmStart) || !Number.isFinite(kmEnd)) {
    return Response.json(
      { ok: false, error: "Datum, Fahrer, Fahrzeug, Start, Ziel und beide km-Stände sind erforderlich." },
      { status: 400 },
    );
  }

  const trip = await createTrip({ date, driverName, vehiclePlate, start, end, kmStart, kmEnd, purpose });
  return Response.json({ ok: true, trip }, { status: 201 });
}
