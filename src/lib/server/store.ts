import { promises as fs } from "node:fs";
import path from "node:path";
import { initialOrders, initialVehicles, type OrderRecord, type VehicleRecord } from "@/lib/fleet-data";

/**
 * Minimal file-backed JSON store standing in for a real database. It exists so the
 * "driver logs into a vehicle" -> "dispatcher sees it live" flow works across
 * separate browser sessions (driver device vs. dispatcher device) talking to the
 * same running Next.js server. It is not concurrency-safe and resets if the
 * `.data/db.json` file is deleted — fine for a demo/single-instance deployment,
 * not a substitute for a real database in production.
 */

type Db = {
  vehicles: VehicleRecord[];
  orders: OrderRecord[];
};

const DB_PATH = path.join(process.cwd(), ".data", "db.json");

async function readDb(): Promise<Db> {
  try {
    const raw = await fs.readFile(DB_PATH, "utf-8");
    return JSON.parse(raw) as Db;
  } catch {
    const seeded: Db = { vehicles: initialVehicles, orders: initialOrders };
    await writeDb(seeded);
    return seeded;
  }
}

async function writeDb(db: Db): Promise<void> {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

export async function getVehicles(): Promise<VehicleRecord[]> {
  const db = await readDb();
  return db.vehicles;
}

export async function getOrders(): Promise<OrderRecord[]> {
  const db = await readDb();
  return db.orders;
}

export async function loginVehicle(
  plate: string,
  driverName: string,
): Promise<{ ok: true; vehicle: VehicleRecord } | { ok: false; error: string }> {
  const db = await readDb();
  const vehicle = db.vehicles.find((v) => v.plate === plate);
  if (!vehicle) return { ok: false, error: "Fahrzeug nicht gefunden." };
  if (vehicle.activeDriver && vehicle.activeDriver !== driverName) {
    return { ok: false, error: `Fahrzeug ist bereits bei ${vehicle.activeDriver} angemeldet.` };
  }

  // A driver can only be logged into one vehicle at a time.
  for (const v of db.vehicles) {
    if (v.activeDriver === driverName && v.plate !== plate) {
      v.activeDriver = null;
      v.activeSince = null;
    }
  }

  vehicle.activeDriver = driverName;
  vehicle.activeSince = new Date().toISOString();
  await writeDb(db);
  return { ok: true, vehicle };
}

export async function logoutVehicle(driverName: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = await readDb();
  const vehicle = db.vehicles.find((v) => v.activeDriver === driverName);
  if (!vehicle) return { ok: false, error: "Kein Fahrzeug für diesen Fahrer angemeldet." };
  vehicle.activeDriver = null;
  vehicle.activeSince = null;
  await writeDb(db);
  return { ok: true };
}

export async function createOrder(input: {
  customer: string;
  pickup: string;
  delivery: string;
  date: string;
  notes?: string;
}): Promise<OrderRecord> {
  const db = await readDb();
  const maxNumber = db.orders.reduce((max, o) => {
    const n = Number(o.id.replace("BF-", ""));
    return Number.isFinite(n) ? Math.max(max, n) : max;
  }, 48200);
  const order: OrderRecord = {
    id: `BF-${maxNumber + 1}`,
    customer: input.customer,
    pickup: input.pickup,
    delivery: input.delivery,
    date: input.date,
    notes: input.notes ?? "",
    status: "Neu",
    driverName: null,
    vehiclePlate: null,
    createdAt: new Date().toISOString(),
  };
  db.orders.unshift(order);
  await writeDb(db);
  return order;
}

export async function updateOrder(
  id: string,
  patch: Partial<Pick<OrderRecord, "status" | "driverName" | "vehiclePlate">>,
): Promise<OrderRecord | null> {
  const db = await readDb();
  const order = db.orders.find((o) => o.id === id);
  if (!order) return null;
  Object.assign(order, patch);
  await writeDb(db);
  return order;
}
