import { promises as fs } from "node:fs";
import path from "node:path";
import {
  COLLECTION_ID_FIELD,
  makeId,
  seedDb,
  type CollectionName,
  type CompanyInfo,
  type Db,
  type DriverCardRecord,
  type EmployeeRecord,
  type FleetCategoryRecord,
  type JobRecord,
  type NewsRecord,
  type PartnerRecord,
  type PublicEmployee,
  type ReminderEntry,
  type ReviewRecord,
  type ServiceRecord,
  type TeamMemberRecord,
} from "@/lib/server/db-types";
import type { OrderMessage, OrderRecord, VehicleRecord } from "@/lib/fleet-data";
import { roleLabels, type RoleKey } from "@/lib/roles";

/**
 * File-backed JSON store standing in for a real database/CMS backend. It exists
 * so cross-role, cross-device flows (a driver's vehicle login reaching the
 * dispatcher, an admin's content edit reaching the public site) work against
 * one shared source of truth on the running server. Not concurrency-safe, and
 * resets if `.data/db.json` is deleted — fine for a demo/single-instance
 * deployment, not a substitute for a real database in production.
 */

const DB_PATH = path.join(process.cwd(), ".data", "db.json");

async function readDb(): Promise<Db> {
  let db: Partial<Db> | null = null;
  try {
    const raw = await fs.readFile(DB_PATH, "utf-8");
    db = JSON.parse(raw) as Partial<Db>;
  } catch {
    db = null;
  }

  if (!db) {
    const seeded = seedDb();
    await writeDb(seeded);
    return seeded;
  }

  // Backfill anything missing from an on-disk db.json written by an earlier
  // version of this schema (e.g. a file saved before "company"/"news"/driver
  // cards existed) — otherwise reads of those collections would return
  // undefined and crash callers like `company.street`.
  const seed = seedDb();
  let changed = false;
  for (const key of Object.keys(seed) as (keyof Db)[]) {
    if (db[key] === undefined) {
      (db as Db)[key] = seed[key] as never;
      changed = true;
    }
  }
  for (const order of db.orders ?? []) {
    if (!Array.isArray(order.messages)) {
      order.messages = [];
      changed = true;
    }
    if (order.origin === undefined) {
      order.origin = "intern";
      order.contactName ??= "";
      order.email ??= "";
      order.phone ??= "";
      order.cargoType ??= "";
      order.requestedPickupDate ??= order.date;
      order.requestedDeliveryDate ??= order.date;
      changed = true;
    }
  }

  if (changed) await writeDb(db as Db);
  return db as Db;
}

async function writeDb(db: Db): Promise<void> {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

// ---------------------------------------------------------------------------
// Generic collection CRUD, used by the admin "Verwaltung" (CMS) API routes.
// ---------------------------------------------------------------------------

export async function listCollection<T = unknown>(name: CollectionName): Promise<T[]> {
  const db = await readDb();
  return db[name] as T[];
}

export async function getCollectionItem<T = unknown>(name: CollectionName, id: string): Promise<T | null> {
  const idField = COLLECTION_ID_FIELD[name];
  const items = await listCollection<Record<string, unknown>>(name);
  return (items.find((item) => item[idField] === id) as T) ?? null;
}

export async function createCollectionItem<T extends Record<string, unknown>>(
  name: CollectionName,
  data: T,
): Promise<T> {
  const db = await readDb();
  const idField = COLLECTION_ID_FIELD[name];
  const item: T = data[idField] ? data : ({ ...data, [idField]: makeId(String(Object.values(data)[0] ?? "item")) } as T);
  (db[name] as unknown as T[]).push(item);
  await writeDb(db);
  return item;
}

export async function updateCollectionItem<T extends Record<string, unknown>>(
  name: CollectionName,
  id: string,
  patch: Partial<T>,
): Promise<T | null> {
  const db = await readDb();
  const idField = COLLECTION_ID_FIELD[name];
  const items = db[name] as unknown as T[];
  const item = items.find((i) => i[idField] === id);
  if (!item) return null;
  Object.assign(item, patch);
  await writeDb(db);
  return item;
}

export async function deleteCollectionItem(name: CollectionName, id: string): Promise<boolean> {
  const db = await readDb();
  const idField = COLLECTION_ID_FIELD[name];
  const items = db[name] as unknown as Record<string, unknown>[];
  const index = items.findIndex((i) => i[idField] === id);
  if (index === -1) return false;
  items.splice(index, 1);
  await writeDb(db);
  return true;
}

// ---------------------------------------------------------------------------
// Typed convenience getters for the CMS content collections, used by the
// public-facing pages (Server Components call these directly — no HTTP hop).
// ---------------------------------------------------------------------------

export async function getNews() {
  return listCollection<NewsRecord>("news");
}

export async function getJobs() {
  return listCollection<JobRecord>("jobs");
}

export async function getServices() {
  return listCollection<ServiceRecord>("services");
}

export async function getManagementTeam() {
  return listCollection<TeamMemberRecord>("management");
}

export async function getKeyPositions() {
  return listCollection<TeamMemberRecord>("keyPositions");
}

export async function getFleetCategories() {
  return listCollection<FleetCategoryRecord>("fleetCategories");
}

export async function getReviews() {
  return listCollection<ReviewRecord>("reviews");
}

export async function getPartners() {
  return listCollection<PartnerRecord>("partners");
}

// ---------------------------------------------------------------------------
// Company info (singleton)
// ---------------------------------------------------------------------------

export async function getCompany(): Promise<CompanyInfo> {
  const db = await readDb();
  return db.company;
}

export async function updateCompany(patch: Partial<CompanyInfo>): Promise<CompanyInfo> {
  const db = await readDb();
  db.company = { ...db.company, ...patch };
  await writeDb(db);
  return db.company;
}

// ---------------------------------------------------------------------------
// Vehicles
// ---------------------------------------------------------------------------

export async function getVehicles(): Promise<VehicleRecord[]> {
  const db = await readDb();
  return db.vehicles;
}

export async function createVehicle(data: Omit<VehicleRecord, "activeDriver" | "activeSince">): Promise<VehicleRecord> {
  const db = await readDb();
  if (db.vehicles.some((v) => v.plate === data.plate)) {
    throw new Error("Ein Fahrzeug mit diesem Kennzeichen existiert bereits.");
  }
  const vehicle: VehicleRecord = { ...data, activeDriver: null, activeSince: null };
  db.vehicles.push(vehicle);
  await writeDb(db);
  return vehicle;
}

export async function deleteVehicle(plate: string): Promise<boolean> {
  const db = await readDb();
  const index = db.vehicles.findIndex((v) => v.plate === plate);
  if (index === -1) return false;
  db.vehicles.splice(index, 1);
  await writeDb(db);
  return true;
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

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export async function getOrders(): Promise<OrderRecord[]> {
  const db = await readDb();
  return db.orders;
}

export async function createOrder(input: {
  customer: string;
  pickup: string;
  delivery: string;
  date?: string;
  notes?: string;
  origin?: "web" | "intern";
  contactName?: string;
  email?: string;
  phone?: string;
  cargoType?: string;
  requestedPickupDate?: string;
  requestedDeliveryDate?: string;
}): Promise<OrderRecord> {
  const db = await readDb();
  const maxNumber = db.orders.reduce((max, o) => {
    const n = Number(o.id.replace("BF-", ""));
    return Number.isFinite(n) ? Math.max(max, n) : max;
  }, 48200);
  const origin = input.origin ?? "web";
  const order: OrderRecord = {
    id: `BF-${maxNumber + 1}`,
    customer: input.customer,
    pickup: input.pickup,
    delivery: input.delivery,
    // Internal orders (Disposition's "Neuer Auftrag") are scheduled immediately;
    // web submissions get their confirmed date only once Disposition accepts them.
    date: origin === "intern" ? (input.date ?? "") : "",
    notes: input.notes ?? "",
    status: origin === "intern" ? "Neu" : "Angefragt",
    driverName: null,
    vehiclePlate: null,
    createdAt: new Date().toISOString(),
    messages: [],
    origin,
    contactName: input.contactName ?? "",
    email: input.email ?? "",
    phone: input.phone ?? "",
    cargoType: input.cargoType ?? "",
    requestedPickupDate: input.requestedPickupDate ?? input.date ?? "",
    requestedDeliveryDate: input.requestedDeliveryDate ?? "",
  };
  db.orders.unshift(order);
  await writeDb(db);
  return order;
}

export async function updateOrder(
  id: string,
  patch: Partial<Pick<OrderRecord, "status" | "driverName" | "vehiclePlate" | "date">>,
): Promise<OrderRecord | null> {
  const db = await readDb();
  const order = db.orders.find((o) => o.id === id);
  if (!order) return null;
  Object.assign(order, patch);
  await writeDb(db);
  return order;
}

export async function addOrderMessage(
  orderId: string,
  message: Omit<OrderMessage, "id" | "at">,
): Promise<OrderRecord | null> {
  const db = await readDb();
  const order = db.orders.find((o) => o.id === orderId);
  if (!order) return null;
  order.messages.push({ ...message, id: makeId(message.text), at: new Date().toISOString() });
  await writeDb(db);
  return order;
}

// ---------------------------------------------------------------------------
// Driver cards
// ---------------------------------------------------------------------------

export async function getDriverCards(): Promise<DriverCardRecord[]> {
  const db = await readDb();
  return db.driverCards;
}

function findCard(db: Db, driverName: string): DriverCardRecord | undefined {
  return db.driverCards.find((c) => c.driverName === driverName);
}

export async function setDriverCardActive(driverName: string, active: boolean): Promise<DriverCardRecord | null> {
  const db = await readDb();
  const card = findCard(db, driverName);
  if (!card) return null;
  card.active = active;
  if (!active && card.onBreak) {
    card.onBreak = false;
    card.breakStartedAt = null;
  }
  await writeDb(db);
  return card;
}

export async function startDriverBreak(driverName: string): Promise<DriverCardRecord | null> {
  const db = await readDb();
  const card = findCard(db, driverName);
  if (!card) return null;
  card.onBreak = true;
  card.breakStartedAt = new Date().toISOString();
  await writeDb(db);
  return card;
}

export async function endDriverBreak(driverName: string): Promise<DriverCardRecord | null> {
  const db = await readDb();
  const card = findCard(db, driverName);
  if (!card) return null;
  if (card.onBreak && card.breakStartedAt) {
    const elapsedMinutes = Math.round((Date.now() - new Date(card.breakStartedAt).getTime()) / 60000);
    card.breakTakenTodayMinutes += Math.max(0, elapsedMinutes);
  }
  card.onBreak = false;
  card.breakStartedAt = null;
  await writeDb(db);
  return card;
}

export async function sendDriverReminder(driverName: string, text: string): Promise<DriverCardRecord | null> {
  const db = await readDb();
  const card = findCard(db, driverName);
  if (!card) return null;
  const reminder: ReminderEntry = { id: makeId(text), text, at: new Date().toISOString(), read: false };
  card.reminders.unshift(reminder);
  await writeDb(db);
  return card;
}

export async function acknowledgeDriverReminder(driverName: string, reminderId: string): Promise<DriverCardRecord | null> {
  const db = await readDb();
  const card = findCard(db, driverName);
  if (!card) return null;
  const reminder = card.reminders.find((r) => r.id === reminderId);
  if (reminder) reminder.read = true;
  await writeDb(db);
  return card;
}

// ---------------------------------------------------------------------------
// Mitarbeiter-Konten (employee accounts) — managed by Geschäftsführung under
// Website-Verwaltung. Fixed role per account, enforced client-side via
// roleModuleAccess (src/lib/roles.ts) same as the seeded demo accounts.
// ---------------------------------------------------------------------------

function toPublicEmployee(employee: EmployeeRecord): PublicEmployee {
  const { id, username, name, role, roleKey, department } = employee;
  return { id, username, name, role, roleKey, department };
}

export async function getEmployees(): Promise<PublicEmployee[]> {
  const db = await readDb();
  return db.employees.map(toPublicEmployee);
}

export async function createEmployee(input: {
  username: string;
  password: string;
  name: string;
  roleKey: RoleKey;
  department: string;
}): Promise<PublicEmployee> {
  const db = await readDb();
  const username = input.username.trim().toLowerCase();
  if (!username) throw new Error("Benutzername ist erforderlich.");
  if (!input.password.trim()) throw new Error("Passwort ist erforderlich.");
  if (db.employees.some((e) => e.username.toLowerCase() === username)) {
    throw new Error("Dieser Benutzername ist bereits vergeben.");
  }

  const employee: EmployeeRecord = {
    id: makeId(username),
    username,
    password: input.password,
    name: input.name.trim(),
    role: roleLabels[input.roleKey],
    roleKey: input.roleKey,
    department: input.department.trim(),
  };
  db.employees.push(employee);

  // Fahrer-Konten brauchen eine Fahrerkarte, damit die digitale Fahrerkarte
  // sofort funktioniert (sonst "keine Karte gefunden" bei erstem Login).
  if (input.roleKey === "fahrer" && !db.driverCards.some((c) => c.driverName === employee.name)) {
    db.driverCards.push({
      driverName: employee.name,
      active: false,
      drivingTodayMinutes: 0,
      drivingWeekMinutes: 0,
      onBreak: false,
      breakStartedAt: null,
      breakTakenTodayMinutes: 0,
      reminders: [],
    });
  }

  await writeDb(db);
  return toPublicEmployee(employee);
}

export async function updateEmployee(
  id: string,
  patch: Partial<{ username: string; password: string; name: string; roleKey: RoleKey; department: string }>,
): Promise<PublicEmployee | null> {
  const db = await readDb();
  const employee = db.employees.find((e) => e.id === id);
  if (!employee) return null;

  if (patch.username !== undefined) {
    const username = patch.username.trim().toLowerCase();
    if (!username) throw new Error("Benutzername ist erforderlich.");
    if (db.employees.some((e) => e.id !== id && e.username.toLowerCase() === username)) {
      throw new Error("Dieser Benutzername ist bereits vergeben.");
    }
    employee.username = username;
  }
  if (patch.password !== undefined && patch.password.trim()) {
    employee.password = patch.password;
  }
  if (patch.name !== undefined && patch.name.trim()) {
    employee.name = patch.name.trim();
  }
  if (patch.department !== undefined) {
    employee.department = patch.department.trim();
  }
  if (patch.roleKey !== undefined) {
    employee.roleKey = patch.roleKey;
    employee.role = roleLabels[patch.roleKey];
    if (patch.roleKey === "fahrer" && !db.driverCards.some((c) => c.driverName === employee.name)) {
      db.driverCards.push({
        driverName: employee.name,
        active: false,
        drivingTodayMinutes: 0,
        drivingWeekMinutes: 0,
        onBreak: false,
        breakStartedAt: null,
        breakTakenTodayMinutes: 0,
        reminders: [],
      });
    }
  }

  await writeDb(db);
  return toPublicEmployee(employee);
}

export async function deleteEmployee(id: string): Promise<boolean> {
  const db = await readDb();
  const index = db.employees.findIndex((e) => e.id === id);
  if (index === -1) return false;
  db.employees.splice(index, 1);
  await writeDb(db);
  return true;
}

export async function verifyEmployeeLogin(username: string, password: string): Promise<PublicEmployee | null> {
  const db = await readDb();
  const employee = db.employees.find((e) => e.username.toLowerCase() === username.trim().toLowerCase());
  if (!employee || employee.password !== password) return null;
  return toPublicEmployee(employee);
}
