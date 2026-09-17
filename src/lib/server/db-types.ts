import {
  company as companySeed,
  services as servicesSeed,
  management as managementSeed,
  keyPositions as keyPositionsSeed,
  news as newsSeed,
  jobs as jobsSeed,
  reviews as reviewsSeed,
  partners as partnersSeed,
  type Service,
  type TeamMember,
  type NewsPost,
  type Job,
  type Review,
  type Partner,
} from "@/lib/data";
import { fleet as fleetSeed, type FleetVehicle } from "@/lib/data";
import { initialOrders, initialVehicles, type OrderRecord, type VehicleRecord } from "@/lib/fleet-data";
import { roleLabels, type RoleKey } from "@/lib/roles";

export type { OrderMessage } from "@/lib/fleet-data";

export type CompanyInfo = typeof companySeed;
export type WithId<T> = T & { id: string };
export type TeamMemberRecord = WithId<TeamMember>;
export type FleetCategoryRecord = WithId<FleetVehicle>;
export type ReviewRecord = WithId<Review>;
export type PartnerRecord = WithId<Partner>;
export type ServiceRecord = Service; // slug already unique, used as id
export type NewsRecord = NewsPost; // slug already unique, used as id
export type JobRecord = Job; // slug already unique, used as id

export type ReminderEntry = { id: string; text: string; at: string; read: boolean };

// (OrderMessage re-exported above from fleet-data.ts, kept there to avoid a
// circular import between fleet-data.ts and this file.)

export type DriverCardRecord = {
  employeeId: string;
  driverName: string;
  active: boolean;
  drivingTodayMinutes: number;
  drivingWeekMinutes: number;
  onBreak: boolean;
  breakStartedAt: string | null;
  breakTakenTodayMinutes: number;
  reminders: ReminderEntry[];
  /**
   * Calendar date (YYYY-MM-DD, website server's local date) of the last
   * processed Tablet `driver_hours.report`. Used by applyDriverHoursReport
   * (store.ts) to detect a day rollover and fold the previous day's final
   * drivingTodayMinutes into drivingWeekMinutes — the only place that field
   * is ever written for a Tablet-linked driver. null for a card that has
   * never received a report yet.
   */
  lastReportDate: string | null;
};

/**
 * A Mitarbeiter-Konto: identified by a linked Discord account (`discordId`,
 * the stable numeric Discord user ID) rather than a password. Login happens
 * via Discord OAuth (src/app/api/auth/discord/*) — the callback matches the
 * signed-in Discord user's ID against this field. A fixed role (RoleKey)
 * determines module access via `roleModuleAccess` (src/lib/roles.ts).
 * Managed by Geschäftsführung under Verwaltung → Mitarbeiter-Konten.
 * `discordId` empty ("") means the account isn't linked yet and can't log in.
 */
export type EmployeeRecord = {
  id: string;
  username: string;
  discordId: string;
  discordUsername: string;
  name: string;
  role: string;
  roleKey: RoleKey;
  department: string;
  /** st_employees.id from the FiveM Speditions-Tablet, if this account is linked/synced from there — null/undefined for website-only accounts. See src/app/api/tablet/webhook/route.ts. */
  tabletEmployeeId?: number | null;
  /**
   * Mirrors the Tablet's st_employees.status for linked accounts ("aktiv"/"inaktiv").
   * Undefined/missing is treated as "aktiv" (all pre-existing website-only accounts).
   * A website-only account (no tabletEmployeeId) is always implicitly "aktiv".
   */
  status?: "aktiv" | "inaktiv";
  /**
   * Führerscheinklassen/Sonderberechtigungen (DriverLicenseKey[], src/lib/roles.ts) —
   * relevant regardless of tablet linkage, but only actually enforced in-game
   * for a tablet-linked account. Editing this for such an account enqueues an
   * `update_driver_permissions` command so the Tablet's st_driver_permissions
   * stays in sync (full replace, see src/lib/server/store.ts updateEmployee).
   */
  driverLicenses?: string[];
};

export type PublicEmployee = EmployeeRecord;

export type PersonnelDocumentRecord = {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
};

/**
 * A Mitarbeiter's Personalakte — created automatically alongside their
 * EmployeeRecord (`id` matches the employee's `id`, 1:1) and never through the
 * generic CMS routes. `documents` only holds metadata; the uploaded bytes
 * themselves live on disk under `.data/uploads/` (see server/store.ts).
 */
export type PersonnelFileRecord = {
  id: string;
  employeeId: string;
  birthDate: string;
  birthPlace: string;
  nationality: string;
  street: string;
  zip: string;
  city: string;
  phonePrivate: string;
  emailPrivate: string;
  hireDate: string;
  employmentType: string;
  healthInsurance: string;
  iban: string;
  notes: string;
  /** ISO timestamp once the Arbeitsvertrag has been auto-generated for this file, or null. Set once, never re-triggered. */
  contractGeneratedAt: string | null;
  documents: PersonnelDocumentRecord[];
};

/**
 * Fields that must all be filled in before the Arbeitsvertrag is generated
 * automatically. Deliberately excludes `notes` (free-text, not part of a
 * contract) and `contractGeneratedAt`/`documents` (not user-editable data).
 */
export const CONTRACT_REQUIRED_FIELDS = [
  "birthDate",
  "birthPlace",
  "nationality",
  "street",
  "zip",
  "city",
  "phonePrivate",
  "emailPrivate",
  "hireDate",
  "employmentType",
  "healthInsurance",
  "iban",
] as const satisfies readonly (keyof PersonnelFileRecord)[];

export function isPersonnelFileComplete(file: PersonnelFileRecord): boolean {
  return CONTRACT_REQUIRED_FIELDS.every((key) => String(file[key] ?? "").trim() !== "");
}

export function makeEmptyPersonnelFile(employeeId: string): PersonnelFileRecord {
  return {
    id: employeeId,
    employeeId,
    birthDate: "",
    birthPlace: "",
    nationality: "",
    street: "",
    zip: "",
    city: "",
    phonePrivate: "",
    emailPrivate: "",
    hireDate: "",
    employmentType: "",
    healthInsurance: "",
    iban: "",
    notes: "",
    contractGeneratedAt: null,
    documents: [],
  };
}

export type StockItemRecord = {
  id: string;
  sku: string;
  name: string;
  location: string;
  stock: number;
  minStock: number;
  unit: string;
};

export type TripPurpose = "Geschäftlich" | "Privat";

export type TripRecord = {
  id: string;
  date: string;
  driverName: string;
  vehiclePlate: string;
  start: string;
  end: string;
  kmStart: number;
  kmEnd: number;
  purpose: TripPurpose;
  /** st_orders.id from the Tablet, if this trip was auto-reported on order completion (see upsertTripFromTablet) — the de-dupe key for repeated pushes. Undefined/null for a manually entered trip. */
  tabletOrderId?: number | null;
  /** "tablet" for an auto-reported trip, "manual"/undefined for one entered by hand on the website. */
  origin?: "tablet" | "manual";
};

export type InvoiceLineItem = { description: string; qty: number; price: number };
export type InvoiceStatus = "Offen" | "Bezahlt" | "Überfällig";

export type InvoiceRecord = {
  number: string;
  /** Links to CustomerRecord.id — "" for legacy invoices created before Kundenstammbaum existed. */
  customerId: string;
  /** Snapshot of the customer's company name at creation time, so the invoice stays readable even if the customer record is later renamed or deleted. */
  customer: string;
  /** Snapshot of the customer's Kundennummer at creation time, same reasoning as `customer`. */
  customerNumber: string;
  /** Name of the employee who created the invoice, captured at creation time. */
  sachbearbeiter: string;
  date: string;
  total: number;
  status: InvoiceStatus;
  items: InvoiceLineItem[];
};

/**
 * Kundenstammbaum entry — a customer's base data, kept separately so a
 * Rechnung only needs to reference a customer instead of re-typing their
 * details every time. Visible only to Geschäftsführung, Prokurist,
 * Betriebsleitung and Disposition (see roleModuleAccess in roles.ts).
 */
export type CustomerRecord = {
  id: string;
  /** Sequential, human-facing customer number, e.g. "K-0001". */
  customerNumber: string;
  companyName: string;
  contactName: string;
  street: string;
  zip: string;
  city: string;
  email: string;
  phone: string;
  notes: string;
  /** Discord user ID for the internal Bestandskunden-Dispositionssystem login (see PublicCustomer/session.ts) — "" until set. */
  discordId: string;
  /** Whether this customer may log in at /kunden with `discordId` above ("Freischalten für Internes Dispositionssystem"). */
  portalEnabled: boolean;
  createdAt: string;
};

/** Shape of a customer exposed to the client after Discord login — same fields as CustomerRecord (nothing more sensitive than an EmployeeRecord carries). */
export type PublicCustomer = CustomerRecord;

/**
 * A single Stempeluhr clock-in/clock-out punch for one employee.
 * `clockOut` is null while the employee is still clocked in.
 */
export type TimeClockEntry = {
  id: string;
  employeeId: string;
  clockIn: string;
  clockOut: string | null;
};

/** Server-computed per-employee Stempeluhr overview, derived from TimeClockEntry[] at read time. */
export type TimeClockSummary = {
  employeeId: string;
  employeeName: string;
  role: string;
  department: string;
  clockedIn: boolean;
  clockedInSince: string | null;
  todayMinutes: number;
  weekMinutes: number;
  monthMinutes: number;
};

export const APPLICATION_STATUSES = ["Neu", "In Prüfung", "Eingeladen", "Angenommen", "Abgelehnt"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/**
 * Statuses where the admin must pick a date/time before it's applied — that
 * date/time is both stored on the record and woven into the status-change
 * Discord DM (interview appointment for "Eingeladen", start date for
 * "Angenommen"). See usage in server/store.ts and the "Bewerbungen"
 * dashboard pages.
 */
export const APPLICATION_STATUSES_REQUIRING_SCHEDULE = ["Eingeladen", "Angenommen"] as const satisfies readonly ApplicationStatus[];

/**
 * A Bewerbung submitted through the public /bewerbung form. `cvFileName` /
 * `cvMimeType` / `cvSize` are all null when no Lebenslauf was attached (the
 * upload is optional); the bytes themselves live on disk under
 * `.data/uploads/`, keyed by this record's own `id` — same pattern as the
 * company logo and Personalakte documents (see server/store.ts).
 */
export type JobApplicationRecord = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  /** Required — status-change DMs and the "must be on our Discord" gate both depend on it. */
  discordId: string;
  /** Job title applied for, or "" for an Initiativbewerbung. */
  position: string;
  message: string;
  cvFileName: string | null;
  cvMimeType: string | null;
  cvSize: number | null;
  status: ApplicationStatus;
  /** Interview appointment ("Eingeladen") or start date ("Angenommen") — null unless the current status requires one. */
  scheduledAt: string | null;
  createdAt: string;
  statusUpdatedAt: string;
};

/** One Discord DM an employee sent back in reply to a contact inquiry — free text, no fixed template. */
export type ContactReply = {
  id: string;
  text: string;
  sentAt: string;
  /** Name of the employee who wrote it, captured at send time. */
  sentBy: string;
};

/**
 * A message submitted through the public contact form (/standort). Like
 * JobApplicationRecord, requires a Discord ID so the bot can reach the
 * sender — there is no email-sending backend in this app.
 */
export type ContactInquiryRecord = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  discordId: string;
  message: string;
  createdAt: string;
  replies: ContactReply[];
};

/**
 * A control-direction command queued for the FiveM Speditions-Tablet to pick
 * up (e.g. Disposition assigning a driver/vehicle to a `origin: "tablet"`
 * order on the website). The tablet's sv_website_bridge.lua polls
 * GET /api/tablet/commands, executes matching `type`s against its own DB,
 * then reports back via POST /api/tablet/commands/[id]/ack — see
 * server/store.ts (enqueueCommand/listPendingCommands/resolveCommand).
 */
export type TabletCommandRecord = {
  id: string;
  type: string;
  data: Record<string, unknown>;
  createdAt: string;
  result?: { ok: boolean; error?: string } | null;
  resolvedAt?: string | null;
};

/**
 * Gültige Standortnamen aus dem Tablet (Config.Locations), gepusht via
 * 'locations.sync' (server/sv_website_bridge.lua, WebsiteBridge.PushLocations).
 * Grundlage für die Auswahl bei "Neuer Auftrag" auf der Website: ein Auftrag
 * kann nur dann per `create_order`-Befehl an das Tablet gemeldet werden, wenn
 * Start-/Zielort exakt einem dieser Namen entsprechen (siehe
 * Orders.CreateFromWebsite im Tablet-Repo).
 */
export type TabletLocationRecord = {
  name: string;
  sourceCargo?: string[];
  destCargo?: string[];
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function makeId(input: string): string {
  return `${slugify(input) || "item"}-${Math.random().toString(36).slice(2, 8)}`;
}

function withIds<T extends Record<string, unknown>>(items: T[], keyFn: (item: T) => string): WithId<T>[] {
  const seen = new Map<string, number>();
  return items.map((item) => {
    const base = slugify(keyFn(item)) || "item";
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    const id = count === 0 ? base : `${base}-${count + 1}`;
    return { ...item, id };
  });
}

export type Db = {
  vehicles: VehicleRecord[];
  orders: OrderRecord[];
  driverCards: DriverCardRecord[];
  employees: EmployeeRecord[];
  personnelFiles: PersonnelFileRecord[];
  stockItems: StockItemRecord[];
  lastInventoryAt: string | null;
  trips: TripRecord[];
  invoices: InvoiceRecord[];
  customers: CustomerRecord[];
  timeClockEntries: TimeClockEntry[];
  applications: JobApplicationRecord[];
  contactInquiries: ContactInquiryRecord[];
  news: NewsRecord[];
  jobs: JobRecord[];
  services: ServiceRecord[];
  management: TeamMemberRecord[];
  keyPositions: TeamMemberRecord[];
  fleetCategories: FleetCategoryRecord[];
  reviews: ReviewRecord[];
  partners: PartnerRecord[];
  company: CompanyInfo;
  /** Control-direction command queue for the FiveM Speditions-Tablet — see TabletCommandRecord. */
  pendingCommands: TabletCommandRecord[];
  /** Gültige Tablet-Standorte/Frachtarten, gepusht via 'locations.sync' — siehe TabletLocationRecord. */
  tabletLocations: TabletLocationRecord[];
  tabletCargoTypes: string[];
};

export const COLLECTION_ID_FIELD = {
  vehicles: "plate",
  orders: "id",
  driverCards: "driverName",
  stockItems: "id",
  trips: "id",
  invoices: "number",
  news: "slug",
  jobs: "slug",
  services: "slug",
  management: "id",
  keyPositions: "id",
  fleetCategories: "id",
  reviews: "id",
  partners: "id",
} as const;

export type CollectionName = keyof typeof COLLECTION_ID_FIELD;

/**
 * Collections exposed through the generic /api/admin/[collection] CRUD routes
 * for the "Verwaltung" CMS. Vehicles/orders/driverCards are deliberately
 * excluded — they have their own routes with real business logic (vehicle
 * login state, order numbering, driving-time tracking) that a generic
 * create/patch/delete would bypass.
 */
export const CMS_COLLECTIONS = [
  "news",
  "jobs",
  "services",
  "management",
  "keyPositions",
  "fleetCategories",
  "reviews",
  "partners",
] as const;

export type CmsCollectionName = (typeof CMS_COLLECTIONS)[number];

export function isCmsCollection(name: string): name is CmsCollectionName {
  return (CMS_COLLECTIONS as readonly string[]).includes(name);
}

function seedEmployees(): EmployeeRecord[] {
  // Bootstrap: the very first Geschäftsführung account has no admin yet to
  // link its Discord account for it, so it's seeded from an env var the site
  // operator sets once (see README). Every other seed account starts
  // unlinked (discordId: "") until Geschäftsführung links a real employee to
  // it under Verwaltung → Mitarbeiter-Konten.
  const ownerDiscordId = process.env.OWNER_DISCORD_ID ?? "";
  const base: Array<Omit<EmployeeRecord, "id">> = [
    { username: "admin", discordId: ownerDiscordId, discordUsername: "", name: "Torsten Wegner", role: roleLabels.geschaeftsfuehrung, roleKey: "geschaeftsfuehrung", department: "Geschäftsleitung" },
    { username: "prokurist", discordId: "", discordUsername: "", name: "Britta Sommer", role: roleLabels.prokurist, roleKey: "prokurist", department: "Geschäftsleitung" },
    { username: "betriebsleiter", discordId: "", discordUsername: "", name: "Nadine Brandt", role: roleLabels.betriebsleiter, roleKey: "betriebsleiter", department: "Betriebsleitung" },
    { username: "chefdisponent", discordId: "", discordUsername: "", name: "Marek Nowicki", role: roleLabels.chefdisponent, roleKey: "chefdisponent", department: "Disposition" },
    { username: "disponent", discordId: "", discordUsername: "", name: "Kevin Albrecht", role: roleLabels.disponent, roleKey: "disponent", department: "Disposition" },
    { username: "lager", discordId: "", discordUsername: "", name: "Sandra Lehmann", role: "Leiterin Lagerlogistik", roleKey: "lager", department: "Lager" },
    { username: "fuhrpark", discordId: "", discordUsername: "", name: "Jonas Petersen", role: "Leiter Fuhrparkmanagement", roleKey: "fuhrpark", department: "Fuhrpark & Werkstatt" },
    { username: "buchhaltung", discordId: "", discordUsername: "", name: "Dennis Kramer", role: "Leiter Buchhaltung", roleKey: "buchhaltung", department: "Finanzbuchhaltung" },
    // No demo "Fahrer" accounts are seeded here (unlike the roles above) —
    // Digitale Fahrerkarte mirrors whichever real employees Geschäftsführung
    // adds with roleKey "fahrer" under Verwaltung → Mitarbeiter-Konten (see
    // the driver-cards sync in server/store.ts), so there's nothing fictional
    // to seed and no placeholder for an operator to forget to replace.
  ];
  return base.map((e) => ({ ...e, id: makeId(e.username) }));
}

export function seedDb(): Db {
  const employees = seedEmployees();
  return {
    vehicles: initialVehicles,
    orders: initialOrders.map((o) => ({ ...o, messages: [] })),
    // Starts empty — driver cards are created automatically (see the sync in
    // server/store.ts) for whichever real employees have roleKey "fahrer".
    driverCards: [],
    employees,
    personnelFiles: employees.map((e) => makeEmptyPersonnelFile(e.id)),
    stockItems: [],
    lastInventoryAt: null,
    trips: [],
    invoices: [],
    customers: [],
    timeClockEntries: [],
    applications: [],
    contactInquiries: [],
    news: newsSeed,
    jobs: jobsSeed,
    services: servicesSeed,
    management: withIds(managementSeed, (m) => m.name),
    keyPositions: withIds(keyPositionsSeed, (m) => m.name),
    fleetCategories: withIds(fleetSeed, (f) => f.category),
    reviews: withIds(reviewsSeed, (r) => `${r.author}-${r.company}`),
    partners: withIds(partnersSeed, (p) => p.name),
    company: companySeed,
    pendingCommands: [],
    tabletLocations: [],
    tabletCargoTypes: [],
  };
}
