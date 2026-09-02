import { logoutVehicle } from "@/lib/server/store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const driverName = typeof body?.driverName === "string" ? body.driverName : null;

  if (!driverName) {
    return Response.json({ ok: false, error: "Fahrername ist erforderlich." }, { status: 400 });
  }

  const result = await logoutVehicle(driverName);
  if (!result.ok) {
    return Response.json(result, { status: 409 });
  }
  return Response.json(result);
}
