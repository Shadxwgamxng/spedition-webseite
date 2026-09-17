import { isAuthorizedTabletRequest, unauthorizedTabletResponse } from "@/lib/server/tablet-auth";
import {
  applyDriverHoursReport,
  applyDriverShiftUpdate,
  applyTimeclockUpdate,
  upsertEmployeeFromTablet,
  upsertOrderFromTablet,
  upsertTabletLocations,
  upsertTabletTransactionFromTablet,
  upsertTripFromTablet,
  upsertVehicleFromTablet,
} from "@/lib/server/store";
import type { VehicleRecord } from "@/lib/fleet-data";
import type { TabletLocationRecord, TabletTransactionType } from "@/lib/server/db-types";

const TABLET_TRANSACTION_TYPES: TabletTransactionType[] = ["einnahme", "auszahlung", "einzahlung", "gehalt"];

/**
 * Push endpoint for the FiveM Speditions-Tablet (server/sv_website_bridge.lua,
 * WebsiteBridge.PushEvent) — see README "Tablet-Sync". One event type per
 * synced domain (Aufträge/Disposition, Fuhrpark, Fahrerkarte/Lenkzeiten,
 * Stempeluhr, Fahrtenbuch, Mitarbeiterkonten); each is a create-or-update
 * against the matching `*FromTablet`/`apply*` store function, never a
 * full-collection replace.
 */

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** The Tablet sends timestamps as MySQL DATETIME ("YYYY-MM-DD HH:MM:SS", server-local, no zone) — turn the space into a "T" so `new Date(...)` reliably parses it instead of relying on non-standard string parsing. */
function tabletTimestamp(value: unknown): string {
  const s = str(value);
  return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s) ? s.replace(" ", "T") : s;
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

  // Server-seitiges Log jedes eingehenden Tablet-Events - vorher war dieser
  // Endpunkt komplett unsichtbar in den eigenen Server-Logs, was das
  // Diagnostizieren (kam der Push überhaupt an?) unnötig erschwert hat.
  console.log(`[tablet-webhook] ${type}`, data);

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
        const restingSince = typeof data.restingSince === "string" && data.restingSince ? tabletTimestamp(data.restingSince) : null;
        const card = await applyDriverHoursReport(tabletEmployeeId, num(data.dailyMinutes), data.resting === true, restingSince);
        if (!card) {
          console.warn(`[tablet-webhook] driver_hours.report: tabletEmployeeId ${tabletEmployeeId} hat kein verknüpftes Website-Konto oder keine Fahrerkarte - Update verworfen.`);
        }
        return Response.json({ ok: true, card });
      }

      case "driver_shift.update": {
        const tabletEmployeeId = num(data.tabletEmployeeId);
        if (!tabletEmployeeId) {
          return Response.json({ ok: false, error: "tabletEmployeeId ist erforderlich." }, { status: 400 });
        }
        const card = await applyDriverShiftUpdate(tabletEmployeeId, data.onShift === true);
        if (!card) {
          console.warn(`[tablet-webhook] driver_shift.update: tabletEmployeeId ${tabletEmployeeId} hat kein verknüpftes Website-Konto oder keine Fahrerkarte - Update verworfen.`);
        }
        return Response.json({ ok: true, card });
      }

      case "timeclock.update": {
        const tabletEmployeeId = num(data.tabletEmployeeId);
        if (!tabletEmployeeId) {
          return Response.json({ ok: false, error: "tabletEmployeeId ist erforderlich." }, { status: 400 });
        }
        const entry = await applyTimeclockUpdate(tabletEmployeeId, data.clockedIn === true, tabletTimestamp(data.at));
        if (!entry) {
          console.warn(`[tablet-webhook] timeclock.update: tabletEmployeeId ${tabletEmployeeId} hat kein verknüpftes Website-Konto, oder es gab keine offene Sitzung zum Ausstempeln - Update verworfen.`);
        }
        return Response.json({ ok: true, entry });
      }

      case "trip.report": {
        const tabletOrderId = num(data.tabletOrderId);
        const driverName = str(data.driverName);
        const vehiclePlate = str(data.vehiclePlate);
        if (!tabletOrderId || !driverName || !vehiclePlate) {
          return Response.json(
            { ok: false, error: "tabletOrderId, driverName und vehiclePlate sind erforderlich." },
            { status: 400 },
          );
        }
        const trip = await upsertTripFromTablet({
          tabletOrderId,
          tabletEmployeeId: num(data.tabletEmployeeId),
          driverName,
          vehiclePlate,
          date: tabletTimestamp(data.date),
          start: str(data.start),
          end: str(data.end),
          kmStart: num(data.kmStart),
          kmEnd: num(data.kmEnd),
        });
        return Response.json({ ok: true, trip });
      }

      case "finance.transaction": {
        const tabletTransactionId = num(data.tabletTransactionId);
        const txType = str(data.type);
        if (!tabletTransactionId || !TABLET_TRANSACTION_TYPES.includes(txType as TabletTransactionType)) {
          return Response.json(
            { ok: false, error: "tabletTransactionId und ein gültiger type sind erforderlich." },
            { status: 400 },
          );
        }
        const transaction = await upsertTabletTransactionFromTablet({
          tabletTransactionId,
          type: txType as TabletTransactionType,
          amount: num(data.amount),
          description: str(data.description),
          driverName: typeof data.driverName === "string" ? data.driverName : null,
          createdByName: typeof data.createdByName === "string" ? data.createdByName : null,
          createdAt: tabletTimestamp(data.createdAt),
          newBalance: num(data.newBalance),
        });
        return Response.json({ ok: true, transaction });
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
