import { loginVehicle } from "@/lib/server/store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const plate = typeof body?.plate === "string" ? body.plate : null;
  const driverName = typeof body?.driverName === "string" ? body.driverName : null;

  if (!plate || !driverName) {
    return Response.json({ ok: false, error: "Fahrzeug und Fahrername sind erforderlich." }, { status: 400 });
  }

  const result = await loginVehicle(plate, driverName);
  if (!result.ok) {
    return Response.json(result, { status: 409 });
  }
  return Response.json(result);
}
