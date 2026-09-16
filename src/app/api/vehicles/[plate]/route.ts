import { deleteVehicle, updateVehicle } from "@/lib/server/store";
import type { MaintenanceStatus } from "@/lib/fleet-data";

const VALID_STATUSES: MaintenanceStatus[] = ["Einsatzbereit", "In Werkstatt", "TÜV fällig"];

export async function PATCH(request: Request, ctx: RouteContext<"/api/vehicles/[plate]">) {
  const { plate } = await ctx.params;
  const body = await request.json().catch(() => null);

  const maintenanceStatus = VALID_STATUSES.includes(body?.maintenanceStatus) ? (body.maintenanceStatus as MaintenanceStatus) : undefined;
  const mileage = body?.mileage !== undefined ? Number(body.mileage) : undefined;
  if (mileage !== undefined && !Number.isFinite(mileage)) {
    return Response.json({ ok: false, error: "Ungültiger Kilometerstand." }, { status: 400 });
  }

  const vehicle = await updateVehicle(decodeURIComponent(plate), { maintenanceStatus, mileage });
  if (!vehicle) return Response.json({ ok: false, error: "Fahrzeug nicht gefunden." }, { status: 404 });
  return Response.json({ ok: true, vehicle });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/vehicles/[plate]">) {
  const { plate } = await ctx.params;
  const ok = await deleteVehicle(decodeURIComponent(plate));
  if (!ok) return Response.json({ ok: false, error: "Fahrzeug nicht gefunden." }, { status: 404 });
  return Response.json({ ok: true });
}
