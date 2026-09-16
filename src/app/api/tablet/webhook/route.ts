import { isAuthorizedTabletRequest, unauthorizedTabletResponse } from "@/lib/server/tablet-auth";
import {
  applyDriverHoursReport,
  upsertEmployeeFromTablet,
  upsertOrderFromTablet,
  upsertTabletLocations,
  upsertVehicleFromTablet,
} from "@/lib/server/store";
import type { VehicleRecord } from "@/lib/fleet-data";
import type { TabletLocationRecord } from "@/lib/server/db-types";

/**
 * Push endpoint for the FiveM Speditions-Tablet (server/sv_website_bridge.lua,
 * WebsiteBridge.PushEvent) — see README "Tablet-Sync". One event type per
 * synced domain (Aufträge/Disposition, Fuhrpark, Fahrerkarte/Lenkzeiten,
 * Mitarbeiterkonten); each is a create-or-update against the matching
 * `*FromTablet` store function, never a full-collection replace.
 */

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

const TABLET_VEHICLE_STATUS_TO_MAINTENANCE: Record<string, VehicleRecord["maintenanceStatus"]> = {
  verfuegbar: "Einsatzbereit",
  im_einsatz: "Einsatzbereit",
  wartung: "In Werkstatt",
  defekt: "In Werkstatt",
  ausser_betrieb: "In Werkstatt",
};

export async function POST(request: Request) {
  if (!isAuthorizedTabletRequest(request)) return unauthorizedTabletResponse();

  const body = await request.json().catch(() => null);
  const type = str(body?.type);
  const data = (body?.data ?? {}) as Record<string, unknown>;
  if (!type) return Response.json({ ok: false, error: "type ist erforderlich." }, { status: 400 });

  try {
    switch (type) {
      case "employee.upsert": {
        const tabletEmployeeId = num(data.tabletEmployeeId);
        const name = str(data.name);
        const websiteRoleKey = str(data.websiteRoleKey);
        const status = data.status === "inaktiv" ? "inaktiv" : "aktiv";
        if (!tabletEmployeeId || !name || !websiteRoleKey) {
          return Response.json({ ok: false, error: "tabletEmployeeId, name und websiteRoleKey sind erforderlich." }, { status: 400 });
        }
        const employee = await upsertEmployeeFromTablet({
          tabletEmployeeId,
          name,
          discordId: typeof data.discordId === "string" ? data.discordId : null,
          websiteRoleKey,
          status,
        });
        return Response.json({ ok: true, employee });
      }

      case "order.upsert": {
        const tabletOrderId = num(data.tabletOrderId);
        const cargo = str(data.cargo);
        const startLocation = str(data.startLocation);
        const endLocation = str(data.endLocation);
        const status = str(data.status);
        if (!tabletOrderId || !cargo || !startLocation || !endLocation || !status) {
          return Response.json(
            { ok: false, error: "tabletOrderId, cargo, startLocation, endLocation und status sind erforderlich." },
            { status: 400 },
          );
        }
        const order = await upsertOrderFromTablet({
          tabletOrderId,
          cargo,
          startLocation,
          endLocation,
          distanceKm: num(data.distanceKm),
          status,
          driverName: typeof data.driverName === "string" ? data.driverName : null,
          vehiclePlate: typeof data.vehiclePlate === "string" ? data.vehiclePlate : null,
        });
        return Response.json({ ok: true, order });
      }

      case "vehicle.upsert": {
        const tabletVehicleId = num(data.tabletVehicleId);
        const plate = str(data.plate);
        if (!tabletVehicleId || !plate) {
          return Response.json({ ok: false, error: "tabletVehicleId und plate sind erforderlich." }, { status: 400 });
        }
        const maintenanceStatus = TABLET_VEHICLE_STATUS_TO_MAINTENANCE[str(data.status)] ?? "Einsatzbereit";
        const vehicle = await upsertVehicleFromTablet({
          tabletVehicleId,
          plate,
          type: str(data.vehicleClass) || str(data.type),
          mileage: num(data.mileage),
          maintenanceStatus,
        });
        return Response.json({ ok: true, vehicle });
      }

      case "driver_hours.report": {
        const tabletEmployeeId = num(data.tabletEmployeeId);
        if (!tabletEmployeeId) {
          return Response.json({ ok: false, error: "tabletEmployeeId ist erforderlich." }, { status: 400 });
        }
        const card = await applyDriverHoursReport(tabletEmployeeId, num(data.dailyMinutes), data.resting === true);
        return Response.json({ ok: true, card });
      }

      case "locations.sync": {
        const locations = Array.isArray(data.locations) ? (data.locations as TabletLocationRecord[]) : [];
        const cargoTypes = Array.isArray(data.cargoTypes) ? (data.cargoTypes as string[]) : [];
        await upsertTabletLocations(locations, cargoTypes);
        return Response.json({ ok: true });
      }

      default:
        return Response.json({ ok: false, error: `Unbekannter Event-Typ "${type}".` }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Fehler.";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
