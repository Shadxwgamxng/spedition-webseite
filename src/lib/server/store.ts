import { promises as fs } from "node:fs";
import path from "node:path";
import {
  COLLECTION_ID_FIELD,
  makeEmptyPersonnelFile,
  makeId,
  seedDb,
  type ApplicationStatus,
  type CollectionName,
  type CompanyInfo,
  type ContactInquiryRecord,
  type CustomerRecord,
  type Db,
  type DriverCardRecord,
  type EmployeeRecord,
  type FleetCategoryRecord,
  type InvoiceRecord,
  type InvoiceStatus,
  type JobApplicationRecord,
  type JobRecord,
  type NewsRecord,
  type PartnerRecord,
  type PersonnelDocumentRecord,
  type PersonnelFileRecord,
  type PublicCustomer,
  type PublicEmployee,
  type ReminderEntry,
  type ReviewRecord,
  type ServiceRecord,
  type StockItemRecord,
  type TeamMemberRecord,
  type TimeClockEntry,
  type TimeClockSummary,
  type TripRecord,
} from "@/lib/server/db-types";
import type { OrderMessage, OrderRecord, OrderStatus, VehicleRecord } from "@/lib/fleet-data";
import { isRoleKey, roleLabels, isDriverLicenseKey, type RoleKey } from "@/lib/roles";
import type { TabletCommandRecord, TabletLocationRecord } from "@/lib/server/db-types";

/**
 * File-backed JSON store standing in for a real database/CMS backend. It exists
 * so cross-role, cross-device flows (a driver's vehicle login reaching the
 * dispatcher, an admin's content edit reaching the public site) work against
 * one shared source of truth on the running server. Not concurrency-safe, and
 * resets if `.data/db.json` is deleted — fine for a demo/single-instance
 * deployment, not a substitute for a real database in production.
 */

const DB_PATH = path.join(process.cwd(), ".data", "db.json");

/**
 * The fabricated example minutes driver cards used to be seeded with (removed
 * in favor of starting at 0 — see seedDb() in db-types.ts). Kept here only so
 * readDb() can recognize and clean up already-persisted .data/db.json files
 * that still have these exact values from before the fix.
 */
const LEGACY_FABRICATED_DRIVER_MINUTES: Record<string, { today: number; week: number; breakTaken: number }> = {
  "Lukas Schmidt": { today: 390, week: 2280, breakTaken: 30 },
  "Piotr Nowak": { today: 252, week: 1740, breakTaken: 15 },
  "Timo Fischer": { today: 0, week: 2640, breakTaken: 60 },
  "Anja Krüger": { today: 468, week: 2460, breakTaken: 20 },
  "Rafael Lindt": { today: 186, week: 1320, breakTaken: 45 },
};

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
    // personnelFiles is handled separately below: it must be derived from this
    // db's own (already-existing) employees, not from a freshly re-seeded
    // employee list with unrelated ids.
    if (key === "personnelFiles") continue;
    if (db[key] === undefined) {
      (db as Db)[key] = seed[key] as never;
      changed = true;
    }
  }

  // The original demo/placeholder driver accounts ("Lukas Schmidt" & co.,
  // usernames fahrer1..fahrer5) are retired — Digitale Fahrerkarte should
  // only ever reflect real "Fahrer" Mitarbeiter-Konten added under
  // Verwaltung, not a fixed fictional roster. Only removes accounts that
  // were never linked to a Discord user (definitely still untouched seed
  // data); an account the operator already linked to a real person is left
  // alone even if it still carries the old placeholder name.
  const LEGACY_PLACEHOLDER_FAHRER_USERNAMES = new Set(["fahrer1", "fahrer2", "fahrer3", "fahrer4", "fahrer5"]);
  if (db.employees) {
    const toRemove = db.employees.filter(
      (e) => LEGACY_PLACEHOLDER_FAHRER_USERNAMES.has(e.username) && e.roleKey === "fahrer" && !e.discordId,
    );
    for (const employee of toRemove) {
      db.employees = db.employees.filter((e) => e.id !== employee.id);
      const fileIndex = (db.personnelFiles ?? []).findIndex((f) => f.employeeId === employee.id);
      if (fileIndex !== -1) {
        const [file] = db.personnelFiles!.splice(fileIndex, 1);
        await Promise.all(file.documents.map((doc) => deleteDocumentFile(doc.id)));
      }
      changed = true;
    }
  }

  // Every employee gets a Personalakte — backfill one for any employee that
  // doesn't have one yet (a missing `personnelFiles` key entirely, or an
  // employee added since the last time this ran).
  db.personnelFiles ??= [];
  for (const employee of db.employees ?? []) {
    if (!db.personnelFiles.some((f) => f.employeeId === employee.id)) {
      db.personnelFiles.push(makeEmptyPersonnelFile(employee.id));
      changed = true;
    }
  }

  // Steuer-ID, Sozialversicherungsnummer and Notfallkontakt were removed from
  // Personalakten — actually erase any values already on disk, not just hide
  // the fields in the UI, and backfill the new contractGeneratedAt tracking
  // field. Removing emergencyContactName/-Phone from CONTRACT_REQUIRED_FIELDS
  // also means an Akte that was already complete except for those two fields
  // is now complete — the next PATCH to it (e.g. just re-opening and saving)
  // generates its Arbeitsvertrag automatically.
  for (const file of db.personnelFiles) {
    const record = file as PersonnelFileRecord & {
      taxId?: string;
      socialSecurityNumber?: string;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
    };
    if ("taxId" in record) {
      delete record.taxId;
      changed = true;
    }
    if ("socialSecurityNumber" in record) {
      delete record.socialSecurityNumber;
      changed = true;
    }
    if ("emergencyContactName" in record) {
      delete record.emergencyContactName;
      changed = true;
    }
    if ("emergencyContactPhone" in record) {
      delete record.emergencyContactPhone;
      changed = true;
    }
    if (record.contractGeneratedAt === undefined) {
      record.contractGeneratedAt = null;
      changed = true;
    }
  }

  // One-time migration: the company logo used to be stored inline as a
  // base64 data: URL in db.company.logoDataUrl — that bloated the single
  // db.json file that's read/written whole on every request across the app,
  // slowing everything down just because a logo was uploaded once. Move any
  // already-persisted logo out to disk (same place Personalakte documents
  // live) and drop the inline field.
  const legacyCompany = db.company as (Db["company"] & { logoDataUrl?: string | null }) | undefined;
  if (legacyCompany?.logoDataUrl) {
    const match = /^data:([^;]+);base64,(.+)$/.exec(legacyCompany.logoDataUrl);
    if (match) {
      const [, mimeType, base64] = match;
      await writeDocumentFile(COMPANY_LOGO_ID, new Uint8Array(Buffer.from(base64, "base64")));
      legacyCompany.logoMimeType = mimeType;
    }
    delete legacyCompany.logoDataUrl;
    changed = true;
  }

  // One-time rename: the "disposition" role was split into "chefdisponent"
  // (leadership) and "disponent" (day-to-day) — existing accounts keep their
  // access by moving to "chefdisponent", the closer match of the two. Runs
  // before the label resync below so the renamed role's display text updates
  // in the same pass.
  for (const employee of db.employees ?? []) {
    if ((employee.roleKey as string) === "disposition") {
      employee.roleKey = "chefdisponent";
      changed = true;
    }
  }
  // Employee.role is always derived from roleModuleAccess's roleLabels, never
  // independently edited — keep it in sync so a role-label change (like the
  // rename above, or "Geschäftsführung" → "Geschäftsführer") reaches every
  // already-persisted employee, not just ones saved again after the change.
  for (const employee of db.employees ?? []) {
    const label = roleLabels[employee.roleKey];
    if (label && employee.role !== label) {
      employee.role = label;
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

  // One-time cleanup for db.json files written before driver cards stopped
  // seeding fabricated example minutes: an untouched card (never activated)
  // still carrying the exact old hardcoded numbers gets reset to a real
  // zeroed-out starting point. Only fires on that exact legacy combination,
  // so genuine recorded driving/break time is never touched.
  for (const card of db.driverCards ?? []) {
    const legacy = LEGACY_FABRICATED_DRIVER_MINUTES[card.driverName];
    if (
      legacy &&
      !card.active &&
      card.drivingTodayMinutes === legacy.today &&
      card.drivingWeekMinutes === legacy.week &&
      card.breakTakenTodayMinutes === legacy.breakTaken
    ) {
      card.drivingTodayMinutes = 0;
      card.drivingWeekMinutes = 0;
      card.breakTakenTodayMinutes = 0;
      changed = true;
    }
  }

  // Driver cards must reflect real employees, not a fixed fictional roster.
  // Every "fahrer" employee gets one automatically; a card for anyone else
  // (e.g. Geschäftsführung covering a shift — see loginVehicle) is left
  // alone as long as that employee still exists, so their recorded
  // driving/break history is never silently dropped just because their role
  // isn't "fahrer". Only a card whose employee was deleted entirely gets
  // pruned. Runs on every read (not just once) so cards stay in sync as
  // Fahrer accounts are added, removed or renamed under Verwaltung.
  // Backfills `employeeId` onto any pre-existing card (schema predates this
  // field) by matching its driverName to a current employee.
  {
    db.driverCards ??= [];
    const employeesById = new Map((db.employees ?? []).map((e) => [e.id, e]));

    for (const card of db.driverCards) {
      const withId = card as DriverCardRecord & { employeeId?: string };
      if (!withId.employeeId) {
        const match = (db.employees ?? []).find((e) => e.name === card.driverName);
        if (match) {
          withId.employeeId = match.id;
          changed = true;
        }
      }
    }

    const beforeCount = db.driverCards.length;
    db.driverCards = db.driverCards.filter((c) => c.employeeId && employeesById.has(c.employeeId));
    if (db.driverCards.length !== beforeCount) changed = true;

    for (const card of db.driverCards) {
      const employee = employeesById.get(card.employeeId)!;
      if (card.driverName !== employee.name) {
        card.driverName = employee.name;
        changed = true;
      }
    }

    for (const employee of (db.employees ?? []).filter((e) => e.roleKey === "fahrer")) {
      if (!db.driverCards.some((c) => c.employeeId === employee.id)) {
        db.driverCards.push({
          employeeId: employee.id,
          driverName: employee.name,
          active: false,
          drivingTodayMinutes: 0,
          drivingWeekMinutes: 0,
          onBreak: false,
          breakStartedAt: null,
          breakTakenTodayMinutes: 0,
          reminders: [],
        });
        changed = true;
      }
    }
  }

  // Backfill customer linkage fields onto invoices created before
  // Kundenstammbaum existed, so old invoices stay readable instead of
  // crashing on the now-required fields.
  for (const invoice of db.invoices ?? []) {
    const record = invoice as InvoiceRecord & { customerId?: string; customerNumber?: string; sachbearbeiter?: string };
    if (record.customerId === undefined) {
      record.customerId = "";
      changed = true;
    }
    if (record.customerNumber === undefined) {
      record.customerNumber = "";
      changed = true;
    }
    if (record.sachbearbeiter === undefined) {
      record.sachbearbeiter = "—";
      changed = true;
    }
  }

  // Backfill scheduledAt onto applications created before the
  // Eingeladen/Angenommen appointment-date feature existed.
  for (const application of db.applications ?? []) {
    const record = application as JobApplicationRecord & { scheduledAt?: string | null };
    if (record.scheduledAt === undefined) {
      record.scheduledAt = null;
      changed = true;
    }
  }

  // Backfill Bestandskunden-Dispositionssystem fields onto customers created
  // before that feature existed — defaults to unlinked/disabled, never
  // silently enabling portal access for an existing customer.
  for (const customer of db.customers ?? []) {
    const record = customer as CustomerRecord & { discordId?: string; portalEnabled?: boolean };
    if (record.discordId === undefined) {
      record.discordId = "";
      changed = true;
    }
    if (record.portalEnabled === undefined) {
      record.portalEnabled = false;
      changed = true;
    }
  }

  // Backfill customerId onto orders created before the Bestandskunden-Portal
  // existed, so old orders stay readable instead of crashing on the
  // now-required field.
  for (const order of db.orders ?? []) {
    const record = order as OrderRecord & { customerId?: string | null };
    if (record.customerId === undefined) {
      record.customerId = null;
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
// Personalakte document storage: uploaded bytes live on disk under
// .data/uploads/, keyed by the document's own id — never by the original
// filename, so a crafted filename can't be used for path traversal. Metadata
// (original name, mime type, size) lives in personnelFiles[].documents in
// db.json; the two are kept in sync by addPersonnelDocument/deletePersonnelDocument.
// ---------------------------------------------------------------------------

const UPLOADS_DIR = path.join(process.cwd(), ".data", "uploads");

async function writeDocumentFile(id: string, bytes: Uint8Array): Promise<void> {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOADS_DIR, id), bytes);
}

async function deleteDocumentFile(id: string): Promise<void> {
  await fs.rm(path.join(UPLOADS_DIR, id), { force: true });
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

const COMPANY_LOGO_ID = "company-logo";
const MAX_LOGO_BYTES = 1.5 * 1024 * 1024;

/**
 * The logo's bytes live on disk (like Personalakte documents), not inline in
 * db.json — db.json is read/written whole on every request across the app,
 * so embedding a multi-hundred-KB base64 image there slows everything down,
 * not just the company form. Only a small `logoMimeType` marker is stored.
 */
export async function setCompanyLogo(bytes: Uint8Array, mimeType: string): Promise<CompanyInfo> {
  if (bytes.byteLength > MAX_LOGO_BYTES) {
    throw new Error("Logo ist zu groß (maximal 1,5 MB).");
  }
  await writeDocumentFile(COMPANY_LOGO_ID, bytes);
  const db = await readDb();
  db.company.logoMimeType = mimeType;
  await writeDb(db);
  return db.company;
}

export async function removeCompanyLogo(): Promise<CompanyInfo> {
  await deleteDocumentFile(COMPANY_LOGO_ID);
  const db = await readDb();
  db.company.logoMimeType = null;
  await writeDb(db);
  return db.company;
}

export async function getCompanyLogo(): Promise<{ bytes: Uint8Array; mimeType: string } | null> {
  const db = await readDb();
  if (!db.company.logoMimeType) return null;
  try {
    const bytes = await fs.readFile(path.join(UPLOADS_DIR, COMPANY_LOGO_ID));
    return { bytes, mimeType: db.company.logoMimeType };
  } catch {
    return null;
  }
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

/**
 * Bearbeitet Status/Kilometerstand eines bestehenden Fahrzeugs. Ist das
 * Fahrzeug mit dem Tablet verknüpft (`tabletVehicleId` gesetzt), wird die
 * Änderung zusätzlich als `update_vehicle`-Befehl für das Tablet eingereiht
 * (siehe enqueueCommand) - reine Website-Fahrzeuge (kein tabletVehicleId)
 * bleiben unverändert website-only.
 */
export async function updateVehicle(
  plate: string,
  data: { maintenanceStatus?: VehicleRecord["maintenanceStatus"]; mileage?: number },
): Promise<VehicleRecord | null> {
  return withSyncLock(async () => {
    const db = await readDb();
    const vehicle = db.vehicles.find((v) => v.plate === plate);
    if (!vehicle) return null;
    if (data.maintenanceStatus !== undefined) vehicle.maintenanceStatus = data.maintenanceStatus;
    if (data.mileage !== undefined) vehicle.mileage = data.mileage;
    await writeDb(db);

    if (vehicle.tabletVehicleId) {
      const tabletStatus = data.maintenanceStatus === "Einsatzbereit" ? "verfuegbar" : "wartung";
      await enqueueCommand("update_vehicle", { plate, status: tabletStatus, mileage: vehicle.mileage });
    }
    return vehicle;
  });
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

  // Any employee can log into a vehicle and act as a driver, not just the
  // "Fahrer" role (e.g. Geschäftsführung covering a shift) — make sure a
  // Fahrerkarte exists for them so driving-time tracking works right away.
  // (roleKey "fahrer" employees already get one automatically — see the
  // driver-cards sync in readDb() — this only covers everyone else.)
  if (!db.driverCards.some((c) => c.driverName === driverName)) {
    const employee = db.employees.find((e) => e.name === driverName);
    if (employee) {
      db.driverCards.push({
        employeeId: employee.id,
        driverName,
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

/**
 * Create-or-update a vehicle from a Tablet `vehicle.upsert` webhook, keyed on
 * `plate` (both sides use the license plate as the natural identifier — the
 * Tablet's numeric `st_vehicles.id` is kept only as `tabletVehicleId` for
 * reference/debugging). Deliberately does not touch `activeDriver`/
 * `activeSince` — that stays purely a website concept (Fahrzeug-Gate login),
 * not something the Tablet reports.
 */
export async function upsertVehicleFromTablet(payload: {
  tabletVehicleId: number;
  plate: string;
  type: string;
  mileage: number;
  maintenanceStatus: VehicleRecord["maintenanceStatus"];
}): Promise<VehicleRecord> {
  return withSyncLock(async () => {
    const db = await readDb();
    let vehicle = db.vehicles.find((v) => v.plate === payload.plate);
    if (vehicle) {
      vehicle.type = payload.type;
      vehicle.mileage = payload.mileage;
      vehicle.maintenanceStatus = payload.maintenanceStatus;
      vehicle.tabletVehicleId = payload.tabletVehicleId;
    } else {
      const now = new Date();
      const inOneYear = new Date(now);
      inOneYear.setFullYear(inOneYear.getFullYear() + 1);
      vehicle = {
        plate: payload.plate,
        type: payload.type,
        year: now.getFullYear(),
        mileage: payload.mileage,
        nextService: inOneYear.toISOString().slice(0, 10),
        nextTuv: inOneYear.toISOString().slice(0, 10),
        maintenanceStatus: payload.maintenanceStatus,
        activeDriver: null,
        activeSince: null,
        tabletVehicleId: payload.tabletVehicleId,
      };
      db.vehicles.push(vehicle);
    }
    await writeDb(db);
    return vehicle;
  });
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export async function getOrders(): Promise<OrderRecord[]> {
  const db = await readDb();
  return db.orders;
}

/** Scoped to one Bestandskunde's own orders — used by /kunden, never returns other customers'/anonymous orders. */
export async function getOrdersForCustomer(customerId: string): Promise<OrderRecord[]> {
  const db = await readDb();
  return db.orders.filter((o) => o.customerId === customerId);
}

export async function createOrder(input: {
  customer: string;
  pickup: string;
  delivery: string;
  date?: string;
  notes?: string;
  origin?: "web" | "kunde" | "intern";
  customerId?: string | null;
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
    // web/kunde submissions get their confirmed date only once Disposition accepts them.
    date: origin === "intern" ? (input.date ?? "") : "",
    notes: input.notes ?? "",
    status: origin === "intern" ? "Neu" : "Angefragt",
    driverName: null,
    vehiclePlate: null,
    createdAt: new Date().toISOString(),
    messages: [],
    origin,
    customerId: input.customerId ?? null,
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

export async function deleteOrder(id: string): Promise<boolean> {
  const db = await readDb();
  const index = db.orders.findIndex((o) => o.id === id);
  if (index === -1) return false;
  db.orders.splice(index, 1);
  await writeDb(db);
  return true;
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

/**
 * Maps a Tablet `st_orders.status` (server/sv_orders.lua's richer, 10-value
 * lifecycle) onto the website's coarser 6-value `OrderStatus` — deliberately
 * a translation function rather than widening `OrderStatus` everywhere across
 * the existing UI, which only ever needs to distinguish "not yet moving" /
 * "on the road" / "done" / "rejected".
 */
export function mapTabletOrderStatus(tabletStatus: string): OrderStatus {
  switch (tabletStatus) {
    case "offen":
    case "disponiert":
      return "Neu";
    case "angenommen":
    case "anfahrt":
    case "beladen":
    case "entladen":
    case "unterwegs":
      return "Unterwegs";
    case "abgeschlossen":
      return "Zugestellt";
    case "abgebrochen":
    case "abgelehnt":
      return "Abgelehnt";
    default:
      return "Neu";
  }
}

export async function findOrderByTabletId(tabletOrderId: number): Promise<OrderRecord | null> {
  const db = await readDb();
  return db.orders.find((o) => o.tabletOrderId === tabletOrderId) ?? null;
}

/**
 * Create-or-update an order from a Tablet `order.upsert` webhook, keyed on
 * `tabletOrderId` (the Tablet's own `st_orders.id`). The Tablet has no
 * "Kunde" concept (it's point-to-point cargo runs, not customer orders), so
 * `customer`/`cargoType` are both set to the cargo description and route
 * details go into `notes`. `origin: "tablet"` marks it for the Disposition UI
 * (see disposition/page.tsx) to route dispatch actions through the command
 * queue instead of a direct PATCH.
 */
export async function upsertOrderFromTablet(payload: {
  tabletOrderId: number;
  cargo: string;
  startLocation: string;
  endLocation: string;
  distanceKm: number;
  status: string;
  driverName: string | null;
  vehiclePlate: string | null;
}): Promise<OrderRecord> {
  return withSyncLock(async () => {
    const db = await readDb();
    const status = mapTabletOrderStatus(payload.status);
    let order = db.orders.find((o) => o.tabletOrderId === payload.tabletOrderId);
    if (order) {
      order.status = status;
      order.driverName = payload.driverName;
      order.vehiclePlate = payload.vehiclePlate;
      order.notes = `${payload.distanceKm.toFixed(0)} km`;
    } else {
      order = {
        id: `BF-T${payload.tabletOrderId}`,
        customer: payload.cargo,
        pickup: payload.startLocation,
        delivery: payload.endLocation,
        date: new Date().toISOString().slice(0, 10),
        notes: `${payload.distanceKm.toFixed(0)} km`,
        status,
        driverName: payload.driverName,
        vehiclePlate: payload.vehiclePlate,
        createdAt: new Date().toISOString(),
        messages: [],
        origin: "tablet",
        tabletOrderId: payload.tabletOrderId,
        customerId: null,
        contactName: "",
        email: "",
        phone: "",
        cargoType: payload.cargo,
        requestedPickupDate: "",
        requestedDeliveryDate: "",
      };
      db.orders.unshift(order);
    }
    await writeDb(db);
    return order;
  });
}

// ---------------------------------------------------------------------------
// Command queue: Disposition-Aktionen auf "tablet"-Aufträgen/-Fahrzeugen
// (Website → Tablet) landen hier statt eines direkten `updateOrder`, weil ein
// bloßer PATCH auf `db.json` nichts im Spiel selbst ändern würde. Das
// Tablet-seitige `sv_website_bridge.lua` pollt `listPendingCommands`, führt
// den Befehl serverseitig gegen die eigene MySQL-DB aus und meldet das
// Ergebnis über `resolveCommand` zurück.
// ---------------------------------------------------------------------------

export async function enqueueCommand(type: string, data: Record<string, unknown>): Promise<TabletCommandRecord> {
  return withSyncLock(async () => {
    const db = await readDb();
    const command: TabletCommandRecord = {
      id: makeId(type),
      type,
      data,
      createdAt: new Date().toISOString(),
      result: null,
      resolvedAt: null,
    };
    db.pendingCommands.push(command);
    await writeDb(db);
    return command;
  });
}

/** Commands the Tablet hasn't reported a result for yet — what its poll loop fetches. */
export async function listPendingCommands(): Promise<TabletCommandRecord[]> {
  const db = await readDb();
  return db.pendingCommands.filter((c) => !c.resolvedAt);
}

export async function resolveCommand(id: string, result: { ok: boolean; error?: string }): Promise<TabletCommandRecord | null> {
  return withSyncLock(async () => {
    const db = await readDb();
    const command = db.pendingCommands.find((c) => c.id === id);
    if (!command) return null;
    command.result = result;
    command.resolvedAt = new Date().toISOString();
    await writeDb(db);
    return command;
  });
}

/**
 * Gültige Standortnamen/Frachtarten aus dem Tablet (Config.Locations,
 * Config.CargoTypes), gepusht via 'locations.sync'. Grundlage für die
 * Auswahl bei "Neuer Auftrag" — nur Aufträge mit Start-/Zielort aus dieser
 * Liste können per `create_order`-Befehl auch im Tablet angelegt werden.
 */
export async function upsertTabletLocations(locations: TabletLocationRecord[], cargoTypes: string[]): Promise<void> {
  return withSyncLock(async () => {
    const db = await readDb();
    db.tabletLocations = locations;
    db.tabletCargoTypes = cargoTypes;
    await writeDb(db);
  });
}

export async function getTabletLocations(): Promise<{ locations: TabletLocationRecord[]; cargoTypes: string[] }> {
  const db = await readDb();
  return { locations: db.tabletLocations, cargoTypes: db.tabletCargoTypes };
}

// ---------------------------------------------------------------------------
// Driver cards
// ---------------------------------------------------------------------------

export async function getDriverCards(): Promise<DriverCardRecord[]> {
  const db = await readDb();
  return db.driverCards;
}

function findCard(db: Db, employeeId: string): DriverCardRecord | undefined {
  return db.driverCards.find((c) => c.employeeId === employeeId);
}

export async function setDriverCardActive(employeeId: string, active: boolean): Promise<DriverCardRecord | null> {
  const db = await readDb();
  const card = findCard(db, employeeId);
  if (!card) return null;
  card.active = active;
  if (!active && card.onBreak) {
    card.onBreak = false;
    card.breakStartedAt = null;
  }
  await writeDb(db);
  return card;
}

export async function startDriverBreak(employeeId: string): Promise<DriverCardRecord | null> {
  const db = await readDb();
  const card = findCard(db, employeeId);
  if (!card) return null;
  card.onBreak = true;
  card.breakStartedAt = new Date().toISOString();
  await writeDb(db);
  return card;
}

export async function endDriverBreak(employeeId: string): Promise<DriverCardRecord | null> {
  const db = await readDb();
  const card = findCard(db, employeeId);
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

export async function sendDriverReminder(employeeId: string, text: string): Promise<DriverCardRecord | null> {
  const db = await readDb();
  const card = findCard(db, employeeId);
  if (!card) return null;
  const reminder: ReminderEntry = { id: makeId(text), text, at: new Date().toISOString(), read: false };
  card.reminders.unshift(reminder);
  await writeDb(db);
  return card;
}

export async function acknowledgeDriverReminder(employeeId: string, reminderId: string): Promise<DriverCardRecord | null> {
  const db = await readDb();
  const card = findCard(db, employeeId);
  if (!card) return null;
  const reminder = card.reminders.find((r) => r.id === reminderId);
  if (reminder) reminder.read = true;
  await writeDb(db);
  return card;
}

/**
 * Applies a Tablet `driver_hours.report` webhook (Lenk-/Ruhezeiten aus
 * server/sv_hours.lua, Hours.Status) onto the matching driver card —
 * `drivingTodayMinutes`/`onBreak` were previously write-only dead fields on
 * the website (nothing ever set them); this is what actually fills them in.
 * No-op (returns null) if the reporting employee has no linked website
 * account yet or no card (e.g. Tablet-Rolle noch nicht auf "fahrer" gemappt).
 */
export async function applyDriverHoursReport(
  tabletEmployeeId: number,
  dailyMinutes: number,
  resting: boolean,
): Promise<DriverCardRecord | null> {
  return withSyncLock(async () => {
    const db = await readDb();
    const employee = db.employees.find((e) => e.tabletEmployeeId === tabletEmployeeId);
    if (!employee) return null;
    const card = findCard(db, employee.id);
    if (!card) return null;
    card.drivingTodayMinutes = Math.max(0, Math.round(dailyMinutes));
    card.onBreak = resting;
    if (!resting) card.breakStartedAt = null;
    await writeDb(db);
    return card;
  });
}

// ---------------------------------------------------------------------------
// Mitarbeiter-Konten (employee accounts) — managed by Geschäftsführung under
// Verwaltung. Fixed role per account, enforced client-side via
// roleModuleAccess (src/lib/roles.ts) same as the seeded demo accounts.
// ---------------------------------------------------------------------------

export async function getEmployees(): Promise<PublicEmployee[]> {
  const db = await readDb();
  return db.employees;
}

export async function getEmployeeById(id: string): Promise<PublicEmployee | null> {
  const db = await readDb();
  return db.employees.find((e) => e.id === id) ?? null;
}

export async function createEmployee(input: {
  username: string;
  discordId: string;
  discordUsername?: string;
  name: string;
  roleKey: RoleKey;
  department: string;
  driverLicenses?: string[];
}): Promise<PublicEmployee> {
  const db = await readDb();
  const username = input.username.trim().toLowerCase();
  const discordId = input.discordId.trim();
  if (!username) throw new Error("Benutzername ist erforderlich.");
  if (!discordId) throw new Error("Discord-Nutzer-ID ist erforderlich.");
  if (db.employees.some((e) => e.username.toLowerCase() === username)) {
    throw new Error("Dieser Benutzername ist bereits vergeben.");
  }
  if (db.employees.some((e) => e.discordId === discordId)) {
    throw new Error("Diese Discord-Nutzer-ID ist bereits einem anderen Konto zugeordnet.");
  }

  const employee: EmployeeRecord = {
    id: makeId(username),
    username,
    discordId,
    discordUsername: input.discordUsername?.trim() ?? "",
    name: input.name.trim(),
    role: roleLabels[input.roleKey],
    roleKey: input.roleKey,
    department: input.department.trim(),
    driverLicenses: input.driverLicenses?.filter(isDriverLicenseKey) ?? [],
  };
  db.employees.push(employee);
  db.personnelFiles.push(makeEmptyPersonnelFile(employee.id));

  // A "Fahrer" account's Fahrerkarte is created automatically by the
  // driver-cards sync in readDb() — it runs on every read, so it's already
  // in place by the time anything reads this employee back.
  await writeDb(db);
  return employee;
}

export async function updateEmployee(
  id: string,
  patch: Partial<{
    username: string;
    discordId: string;
    discordUsername: string;
    name: string;
    roleKey: RoleKey;
    department: string;
    driverLicenses: string[];
  }>,
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
  if (patch.discordId !== undefined) {
    const discordId = patch.discordId.trim();
    if (discordId && db.employees.some((e) => e.id !== id && e.discordId === discordId)) {
      throw new Error("Diese Discord-Nutzer-ID ist bereits einem anderen Konto zugeordnet.");
    }
    employee.discordId = discordId;
  }
  if (patch.discordUsername !== undefined) {
    employee.discordUsername = patch.discordUsername.trim();
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
    // Fahrerkarte creation for a newly-"fahrer" employee is handled by the
    // driver-cards sync in readDb(), which runs on every read.
  }
  if (patch.driverLicenses !== undefined) {
    employee.driverLicenses = patch.driverLicenses.filter(isDriverLicenseKey);
  }

  await writeDb(db);
  return employee;
}

export async function deleteEmployee(id: string): Promise<boolean> {
  const db = await readDb();
  const index = db.employees.findIndex((e) => e.id === id);
  if (index === -1) return false;
  db.employees.splice(index, 1);

  const fileIndex = db.personnelFiles.findIndex((f) => f.employeeId === id);
  if (fileIndex !== -1) {
    const [file] = db.personnelFiles.splice(fileIndex, 1);
    await Promise.all(file.documents.map((doc) => deleteDocumentFile(doc.id)));
  }

  await writeDb(db);
  return true;
}

export async function verifyDiscordLogin(discordId: string): Promise<PublicEmployee | null> {
  const db = await readDb();
  const employee = db.employees.find((e) => e.discordId && e.discordId === discordId);
  return employee ?? null;
}

// ---------------------------------------------------------------------------
// FiveM Speditions-Tablet sync (Aufträge/Disposition, Fuhrpark, Fahrerkarte,
// Mitarbeiterkonten) — see src/app/api/tablet/webhook/route.ts.
//
// `withSyncLock` serializes these specific functions against each other (a
// simple promise-chain mutex) so a burst of near-simultaneous webhook
// deliveries from the game server can't clobber one another with a lost
// read-modify-write — the store as a whole has no such protection (see the
// class doc-comment above), this only closes the gap for the new tablet-sync
// write paths, which are the ones actually expected to fire in quick
// succession from an external, non-interactive caller.
// ---------------------------------------------------------------------------

let syncQueue: Promise<unknown> = Promise.resolve();

function withSyncLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = syncQueue.then(fn, fn);
  syncQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export async function findEmployeeByTabletId(tabletEmployeeId: number): Promise<PublicEmployee | null> {
  const db = await readDb();
  return db.employees.find((e) => e.tabletEmployeeId === tabletEmployeeId) ?? null;
}

/**
 * Create-or-update an employee from a Tablet `employee.upsert` webhook.
 * Unlike the public `createEmployee` (used by the website's own "Mitarbeiter
 * einstellen" form), `discordId` is optional here — a Tablet-hired employee
 * may not have a Discord account linked yet; that can be added later under
 * Verwaltung → Mitarbeiter-Konten. `websiteRoleKey` must be a valid RoleKey
 * (the Geschäftsführung maps each Tablet-Rolle to one of the 9 website roles
 * in the Tablet's Rollen-Editor) — an employee whose Tablet-Rolle has no
 * mapping yet is rejected rather than guessed at.
 */
export async function upsertEmployeeFromTablet(payload: {
  tabletEmployeeId: number;
  name: string;
  discordId?: string | null;
  websiteRoleKey: string;
  status: "aktiv" | "inaktiv";
  department?: string;
}): Promise<PublicEmployee> {
  return withSyncLock(async () => {
    if (!isRoleKey(payload.websiteRoleKey)) {
      throw new Error(
        `Unbekannte Website-Rolle "${payload.websiteRoleKey}" — im Tablet unter Rollen die Website-Rolle für diese Rolle zuordnen.`,
      );
    }
    const db = await readDb();
    const discordId = payload.discordId?.trim() ?? "";
    if (discordId && db.employees.some((e) => e.tabletEmployeeId !== payload.tabletEmployeeId && e.discordId === discordId)) {
      throw new Error("Diese Discord-Nutzer-ID ist bereits einem anderen Konto zugeordnet.");
    }

    let employee = db.employees.find((e) => e.tabletEmployeeId === payload.tabletEmployeeId);
    if (employee) {
      employee.name = payload.name;
      employee.roleKey = payload.websiteRoleKey;
      employee.role = roleLabels[payload.websiteRoleKey];
      employee.status = payload.status;
      if (discordId) employee.discordId = discordId;
      if (payload.department !== undefined) employee.department = payload.department;
    } else {
      let username = payload.name.trim().toLowerCase().replace(/\s+/g, ".").replace(/[^a-z0-9.]/g, "") || `tablet-${payload.tabletEmployeeId}`;
      if (db.employees.some((e) => e.username.toLowerCase() === username)) {
        username = `${username}-${payload.tabletEmployeeId}`;
      }
      employee = {
        id: makeId(username),
        username,
        discordId,
        discordUsername: "",
        name: payload.name,
        role: roleLabels[payload.websiteRoleKey],
        roleKey: payload.websiteRoleKey,
        department: payload.department ?? "",
        tabletEmployeeId: payload.tabletEmployeeId,
        status: payload.status,
      };
      db.employees.push(employee);
      db.personnelFiles.push(makeEmptyPersonnelFile(employee.id));
    }

    await writeDb(db);
    return employee;
  });
}

// ---------------------------------------------------------------------------
// Lagerverwaltung (stock items + inventories)
// ---------------------------------------------------------------------------

export async function getStockItems(): Promise<{ items: StockItemRecord[]; lastInventoryAt: string | null }> {
  const db = await readDb();
  return { items: db.stockItems, lastInventoryAt: db.lastInventoryAt };
}

export async function createStockItem(data: Omit<StockItemRecord, "id">): Promise<StockItemRecord> {
  const db = await readDb();
  if (db.stockItems.some((i) => i.sku.toLowerCase() === data.sku.toLowerCase())) {
    throw new Error("Ein Artikel mit diesem SKU existiert bereits.");
  }
  const item: StockItemRecord = { ...data, id: makeId(data.sku) };
  db.stockItems.push(item);
  await writeDb(db);
  return item;
}

export async function deleteStockItem(id: string): Promise<boolean> {
  const db = await readDb();
  const index = db.stockItems.findIndex((i) => i.id === id);
  if (index === -1) return false;
  db.stockItems.splice(index, 1);
  await writeDb(db);
  return true;
}

export async function applyInventoryCounts(counts: Record<string, number>): Promise<StockItemRecord[]> {
  const db = await readDb();
  for (const item of db.stockItems) {
    if (counts[item.id] !== undefined && Number.isFinite(counts[item.id])) {
      item.stock = Math.max(0, Math.round(counts[item.id]));
    }
  }
  db.lastInventoryAt = new Date().toISOString();
  await writeDb(db);
  return db.stockItems;
}

// ---------------------------------------------------------------------------
// Digitales Fahrtenbuch
// ---------------------------------------------------------------------------

export async function getTrips(): Promise<TripRecord[]> {
  const db = await readDb();
  return db.trips;
}

export async function createTrip(input: {
  date: string;
  driverName: string;
  vehiclePlate: string;
  start: string;
  end: string;
  kmStart: number;
  kmEnd: number;
  purpose: TripRecord["purpose"];
}): Promise<TripRecord> {
  const db = await readDb();
  const maxNumber = db.trips.reduce((max, t) => {
    const n = Number(t.id.replace("FT-", ""));
    return Number.isFinite(n) ? Math.max(max, n) : max;
  }, 9000);
  const trip: TripRecord = {
    id: `FT-${maxNumber + 1}`,
    date: input.date,
    driverName: input.driverName,
    vehiclePlate: input.vehiclePlate,
    start: input.start,
    end: input.end,
    kmStart: input.kmStart,
    kmEnd: Math.max(input.kmEnd, input.kmStart),
    purpose: input.purpose,
  };
  db.trips.unshift(trip);
  await writeDb(db);
  return trip;
}

export async function deleteTrip(id: string): Promise<boolean> {
  const db = await readDb();
  const index = db.trips.findIndex((t) => t.id === id);
  if (index === -1) return false;
  db.trips.splice(index, 1);
  await writeDb(db);
  return true;
}

// ---------------------------------------------------------------------------
// Rechnungserstellung
// ---------------------------------------------------------------------------

export async function getInvoices(): Promise<InvoiceRecord[]> {
  const db = await readDb();
  return db.invoices;
}

export async function createInvoice(input: {
  customerId: string;
  sachbearbeiter: string;
  items: InvoiceRecord["items"];
  total: number;
}): Promise<InvoiceRecord> {
  const db = await readDb();
  const customer = db.customers.find((c) => c.id === input.customerId);
  if (!customer) throw new Error("Kunde nicht gefunden.");
  const year = new Date().getFullYear();
  const maxNumber = db.invoices.reduce((max, i) => {
    const n = Number(i.number.split("-").pop());
    return Number.isFinite(n) ? Math.max(max, n) : max;
  }, 340);
  const invoice: InvoiceRecord = {
    number: `RE-${year}-${String(maxNumber + 1).padStart(4, "0")}`,
    customerId: customer.id,
    customer: customer.companyName,
    customerNumber: customer.customerNumber,
    sachbearbeiter: input.sachbearbeiter,
    date: new Date().toISOString().slice(0, 10),
    total: input.total,
    status: "Offen",
    items: input.items,
  };
  db.invoices.unshift(invoice);
  await writeDb(db);
  return invoice;
}

export async function updateInvoiceStatus(number: string, status: InvoiceStatus): Promise<InvoiceRecord | null> {
  const db = await readDb();
  const invoice = db.invoices.find((i) => i.number === number);
  if (!invoice) return null;
  invoice.status = status;
  await writeDb(db);
  return invoice;
}

export async function deleteInvoice(number: string): Promise<boolean> {
  const db = await readDb();
  const index = db.invoices.findIndex((i) => i.number === number);
  if (index === -1) return false;
  db.invoices.splice(index, 1);
  await writeDb(db);
  return true;
}

// ---------------------------------------------------------------------------
// Kundenstammbaum
// ---------------------------------------------------------------------------

export async function getCustomers(): Promise<CustomerRecord[]> {
  const db = await readDb();
  return db.customers;
}

export async function getCustomerById(id: string): Promise<CustomerRecord | null> {
  const db = await readDb();
  return db.customers.find((c) => c.id === id) ?? null;
}

export async function createCustomer(input: {
  companyName: string;
  contactName: string;
  street: string;
  zip: string;
  city: string;
  email: string;
  phone: string;
  notes: string;
  discordId?: string;
  portalEnabled?: boolean;
}): Promise<CustomerRecord> {
  const companyName = input.companyName.trim();
  if (!companyName) throw new Error("Firmenname ist erforderlich.");
  const discordId = input.discordId?.trim() ?? "";
  const portalEnabled = input.portalEnabled ?? false;
  if (portalEnabled && !discordId) {
    throw new Error("Für die Freischaltung des Dispositionssystems ist eine Discord-Nutzer-ID erforderlich.");
  }
  const db = await readDb();
  if (discordId && db.customers.some((c) => c.discordId === discordId)) {
    throw new Error("Diese Discord-Nutzer-ID ist bereits einem anderen Kunden zugeordnet.");
  }
  const maxNumber = db.customers.reduce((max, c) => {
    const n = Number(c.customerNumber.split("-").pop());
    return Number.isFinite(n) ? Math.max(max, n) : max;
  }, 0);
  const customer: CustomerRecord = {
    id: makeId(companyName),
    customerNumber: `K-${String(maxNumber + 1).padStart(4, "0")}`,
    companyName,
    contactName: input.contactName.trim(),
    street: input.street.trim(),
    zip: input.zip.trim(),
    city: input.city.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    notes: input.notes,
    discordId,
    portalEnabled,
    createdAt: new Date().toISOString(),
  };
  db.customers.push(customer);
  await writeDb(db);
  return customer;
}

export async function updateCustomer(
  id: string,
  patch: Partial<Omit<CustomerRecord, "id" | "customerNumber" | "createdAt">>,
): Promise<CustomerRecord | null> {
  const db = await readDb();
  const customer = db.customers.find((c) => c.id === id);
  if (!customer) return null;
  if (patch.companyName !== undefined && !patch.companyName.trim()) {
    throw new Error("Firmenname ist erforderlich.");
  }
  const nextDiscordId = patch.discordId !== undefined ? patch.discordId.trim() : customer.discordId;
  const nextPortalEnabled = patch.portalEnabled !== undefined ? patch.portalEnabled : customer.portalEnabled;
  if (nextPortalEnabled && !nextDiscordId) {
    throw new Error("Für die Freischaltung des Dispositionssystems ist eine Discord-Nutzer-ID erforderlich.");
  }
  if (nextDiscordId && db.customers.some((c) => c.id !== id && c.discordId === nextDiscordId)) {
    throw new Error("Diese Discord-Nutzer-ID ist bereits einem anderen Kunden zugeordnet.");
  }
  Object.assign(customer, patch, { discordId: nextDiscordId, portalEnabled: nextPortalEnabled });
  await writeDb(db);
  return customer;
}

/** Bestandskunden-Login (/kunden) — matches a Discord user against a customer with the portal explicitly enabled. */
export async function verifyCustomerLogin(discordId: string): Promise<PublicCustomer | null> {
  const db = await readDb();
  const customer = db.customers.find((c) => c.portalEnabled && c.discordId && c.discordId === discordId);
  return customer ?? null;
}

export async function deleteCustomer(id: string): Promise<boolean> {
  const db = await readDb();
  const index = db.customers.findIndex((c) => c.id === id);
  if (index === -1) return false;
  db.customers.splice(index, 1);
  await writeDb(db);
  return true;
}

// ---------------------------------------------------------------------------
// Stempeluhr
// ---------------------------------------------------------------------------

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfIsoWeek(d: Date): Date {
  const x = startOfDay(d);
  const mondayOffset = (x.getDay() + 6) % 7; // Mon=0 .. Sun=6
  x.setDate(x.getDate() - mondayOffset);
  return x;
}

function startOfMonth(d: Date): Date {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function entryMinutes(entry: TimeClockEntry, now: number): number {
  const start = new Date(entry.clockIn).getTime();
  const end = entry.clockOut ? new Date(entry.clockOut).getTime() : now;
  return Math.max(0, Math.round((end - start) / 60000));
}

export async function getTimeClockSummaries(): Promise<TimeClockSummary[]> {
  const db = await readDb();
  const now = Date.now();
  const dayStart = startOfDay(new Date(now)).getTime();
  const weekStart = startOfIsoWeek(new Date(now)).getTime();
  const monthStart = startOfMonth(new Date(now)).getTime();

  return db.employees.map((employee) => {
    const entries = db.timeClockEntries.filter((e) => e.employeeId === employee.id);
    let today = 0;
    let week = 0;
    let month = 0;
    let clockedIn = false;
    let clockedInSince: string | null = null;
    for (const entry of entries) {
      const start = new Date(entry.clockIn).getTime();
      const minutes = entryMinutes(entry, now);
      if (start >= monthStart) month += minutes;
      if (start >= weekStart) week += minutes;
      if (start >= dayStart) today += minutes;
      if (entry.clockOut === null) {
        clockedIn = true;
        clockedInSince = entry.clockIn;
      }
    }
    return {
      employeeId: employee.id,
      employeeName: employee.name,
      role: employee.role,
      department: employee.department,
      clockedIn,
      clockedInSince,
      todayMinutes: today,
      weekMinutes: week,
      monthMinutes: month,
    };
  });
}

export async function clockIn(employeeId: string): Promise<TimeClockEntry> {
  const db = await readDb();
  if (!db.employees.some((e) => e.id === employeeId)) throw new Error("Mitarbeiter nicht gefunden.");
  if (db.timeClockEntries.some((e) => e.employeeId === employeeId && e.clockOut === null)) {
    throw new Error("Bereits eingestempelt.");
  }
  const entry: TimeClockEntry = {
    id: makeId(employeeId),
    employeeId,
    clockIn: new Date().toISOString(),
    clockOut: null,
  };
  db.timeClockEntries.push(entry);
  await writeDb(db);
  return entry;
}

export async function clockOut(employeeId: string): Promise<TimeClockEntry> {
  const db = await readDb();
  const entry = db.timeClockEntries.find((e) => e.employeeId === employeeId && e.clockOut === null);
  if (!entry) throw new Error("Nicht eingestempelt.");
  entry.clockOut = new Date().toISOString();
  await writeDb(db);
  return entry;
}

// ---------------------------------------------------------------------------
// Personalakten
// ---------------------------------------------------------------------------

const MAX_DOCUMENT_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

export async function getPersonnelFiles(): Promise<PersonnelFileRecord[]> {
  const db = await readDb();
  return db.personnelFiles;
}

export async function getPersonnelFile(employeeId: string): Promise<PersonnelFileRecord | null> {
  const db = await readDb();
  return db.personnelFiles.find((f) => f.employeeId === employeeId) ?? null;
}

export async function updatePersonnelFile(
  employeeId: string,
  patch: Partial<Omit<PersonnelFileRecord, "id" | "employeeId" | "documents">>,
): Promise<PersonnelFileRecord | null> {
  const db = await readDb();
  const file = db.personnelFiles.find((f) => f.employeeId === employeeId);
  if (!file) return null;
  Object.assign(file, patch);
  await writeDb(db);
  return file;
}

export async function addPersonnelDocument(
  employeeId: string,
  input: { fileName: string; mimeType: string; bytes: Uint8Array },
): Promise<PersonnelDocumentRecord> {
  if (input.bytes.byteLength > MAX_DOCUMENT_SIZE_BYTES) {
    throw new Error("Datei ist zu groß (maximal 20 MB).");
  }
  const db = await readDb();
  const file = db.personnelFiles.find((f) => f.employeeId === employeeId);
  if (!file) throw new Error("Personalakte nicht gefunden.");

  const document: PersonnelDocumentRecord = {
    id: makeId(input.fileName),
    fileName: input.fileName.slice(0, 200) || "Datei",
    mimeType: input.mimeType || "application/octet-stream",
    size: input.bytes.byteLength,
    uploadedAt: new Date().toISOString(),
  };
  await writeDocumentFile(document.id, input.bytes);
  file.documents.push(document);
  await writeDb(db);
  return document;
}

export async function deletePersonnelDocument(employeeId: string, documentId: string): Promise<boolean> {
  const db = await readDb();
  const file = db.personnelFiles.find((f) => f.employeeId === employeeId);
  if (!file) return false;
  const index = file.documents.findIndex((d) => d.id === documentId);
  if (index === -1) return false;
  file.documents.splice(index, 1);
  await deleteDocumentFile(documentId);
  await writeDb(db);
  return true;
}

export async function getPersonnelDocument(
  employeeId: string,
  documentId: string,
): Promise<{ record: PersonnelDocumentRecord; filePath: string } | null> {
  const db = await readDb();
  const file = db.personnelFiles.find((f) => f.employeeId === employeeId);
  const record = file?.documents.find((d) => d.id === documentId);
  if (!record) return null;
  return { record, filePath: path.join(UPLOADS_DIR, documentId) };
}

// ---------------------------------------------------------------------------
// Bewerbungen (Bewerbungsportal)
// ---------------------------------------------------------------------------

export async function getApplications(): Promise<JobApplicationRecord[]> {
  const db = await readDb();
  return db.applications;
}

export async function getApplication(id: string): Promise<JobApplicationRecord | null> {
  const db = await readDb();
  return db.applications.find((a) => a.id === id) ?? null;
}

export async function createApplication(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  discordId: string;
  position: string;
  message: string;
  cv?: { fileName: string; mimeType: string; bytes: Uint8Array } | null;
}): Promise<JobApplicationRecord> {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = input.email.trim();
  const discordId = input.discordId.trim();
  if (!firstName || !lastName) throw new Error("Vor- und Nachname sind erforderlich.");
  if (!email) throw new Error("E-Mail ist erforderlich.");
  if (!discordId) throw new Error("Discord-Nutzer-ID ist erforderlich.");
  if (input.cv && input.cv.bytes.byteLength > MAX_DOCUMENT_SIZE_BYTES) {
    throw new Error("Datei ist zu groß (maximal 20 MB).");
  }

  const db = await readDb();
  const id = makeId(`${firstName}-${lastName}`);
  const now = new Date().toISOString();
  const application: JobApplicationRecord = {
    id,
    firstName,
    lastName,
    email,
    phone: input.phone.trim(),
    discordId,
    position: input.position.trim(),
    message: input.message,
    cvFileName: input.cv ? input.cv.fileName.slice(0, 200) || "Lebenslauf.pdf" : null,
    cvMimeType: input.cv ? input.cv.mimeType || "application/octet-stream" : null,
    cvSize: input.cv ? input.cv.bytes.byteLength : null,
    status: "Neu",
    scheduledAt: null,
    createdAt: now,
    statusUpdatedAt: now,
  };
  if (input.cv) {
    await writeDocumentFile(id, input.cv.bytes);
  }
  db.applications.unshift(application);
  await writeDb(db);
  return application;
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
  scheduledAt: string | null,
): Promise<JobApplicationRecord | null> {
  const db = await readDb();
  const application = db.applications.find((a) => a.id === id);
  if (!application) return null;
  application.status = status;
  application.scheduledAt = scheduledAt;
  application.statusUpdatedAt = new Date().toISOString();
  await writeDb(db);
  return application;
}

export async function getApplicationCv(
  id: string,
): Promise<{ fileName: string; mimeType: string; size: number; filePath: string } | null> {
  const db = await readDb();
  const application = db.applications.find((a) => a.id === id);
  if (!application || !application.cvFileName || !application.cvMimeType || application.cvSize === null) return null;
  return {
    fileName: application.cvFileName,
    mimeType: application.cvMimeType,
    size: application.cvSize,
    filePath: path.join(UPLOADS_DIR, id),
  };
}

// ---------------------------------------------------------------------------
// Kontaktanfragen (Kontaktformular auf /standort)
// ---------------------------------------------------------------------------

export async function getContactInquiries(): Promise<ContactInquiryRecord[]> {
  const db = await readDb();
  return db.contactInquiries;
}

export async function getContactInquiry(id: string): Promise<ContactInquiryRecord | null> {
  const db = await readDb();
  return db.contactInquiries.find((i) => i.id === id) ?? null;
}

export async function createContactInquiry(input: {
  name: string;
  company: string;
  email: string;
  phone: string;
  discordId: string;
  message: string;
}): Promise<ContactInquiryRecord> {
  const name = input.name.trim();
  const email = input.email.trim();
  const discordId = input.discordId.trim();
  if (!name) throw new Error("Name ist erforderlich.");
  if (!email) throw new Error("E-Mail ist erforderlich.");
  if (!discordId) throw new Error("Discord-Nutzer-ID ist erforderlich.");

  const db = await readDb();
  const inquiry: ContactInquiryRecord = {
    id: makeId(name),
    name,
    company: input.company.trim(),
    email,
    phone: input.phone.trim(),
    discordId,
    message: input.message,
    createdAt: new Date().toISOString(),
    replies: [],
  };
  db.contactInquiries.unshift(inquiry);
  await writeDb(db);
  return inquiry;
}

export async function addContactReply(
  id: string,
  input: { text: string; sentBy: string },
): Promise<ContactInquiryRecord | null> {
  const text = input.text.trim();
  if (!text) throw new Error("Nachricht darf nicht leer sein.");
  const db = await readDb();
  const inquiry = db.contactInquiries.find((i) => i.id === id);
  if (!inquiry) return null;
  inquiry.replies.push({
    id: makeId(text),
    text,
    sentAt: new Date().toISOString(),
    sentBy: input.sentBy,
  });
  await writeDb(db);
  return inquiry;
}
