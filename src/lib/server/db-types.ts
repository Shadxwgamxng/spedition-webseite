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
import { initialOrders, initialVehicles, driverRoster, type OrderRecord, type VehicleRecord } from "@/lib/fleet-data";
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
  driverName: string;
  active: boolean;
  drivingTodayMinutes: number;
  drivingWeekMinutes: number;
  onBreak: boolean;
  breakStartedAt: string | null;
  breakTakenTodayMinutes: number;
  reminders: ReminderEntry[];
};

/**
 * A Mitarbeiter-Konto: identified by a linked Discord account (`discordId`,
 * the stable numeric Discord user ID) rather than a password. Login happens
 * via Discord OAuth (src/app/api/auth/discord/*) — the callback matches the
 * signed-in Discord user's ID against this field. A fixed role (RoleKey)
 * determines module access via `roleModuleAccess` (src/lib/roles.ts).
 * Managed by Geschäftsführung under Website-Verwaltung → Mitarbeiter-Konten.
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
  taxId: string;
  socialSecurityNumber: string;
  healthInsurance: string;
  iban: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  notes: string;
  documents: PersonnelDocumentRecord[];
};

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
    taxId: "",
    socialSecurityNumber: "",
    healthInsurance: "",
    iban: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    notes: "",
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
};

export type InvoiceLineItem = { description: string; qty: number; price: number };
export type InvoiceStatus = "Offen" | "Bezahlt" | "Überfällig";

export type InvoiceRecord = {
  number: string;
  customer: string;
  date: string;
  total: number;
  status: InvoiceStatus;
  items: InvoiceLineItem[];
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
  news: NewsRecord[];
  jobs: JobRecord[];
  services: ServiceRecord[];
  management: TeamMemberRecord[];
  keyPositions: TeamMemberRecord[];
  fleetCategories: FleetCategoryRecord[];
  reviews: ReviewRecord[];
  partners: PartnerRecord[];
  company: CompanyInfo;
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
  // it under Website-Verwaltung → Mitarbeiter-Konten.
  const ownerDiscordId = process.env.OWNER_DISCORD_ID ?? "";
  const base: Array<Omit<EmployeeRecord, "id">> = [
    { username: "admin", discordId: ownerDiscordId, discordUsername: "", name: "Torsten Wegner", role: roleLabels.geschaeftsfuehrung, roleKey: "geschaeftsfuehrung", department: "Geschäftsleitung" },
    { username: "disposition", discordId: "", discordUsername: "", name: "Marek Nowicki", role: "Leiter Disposition", roleKey: "disposition", department: "Disposition" },
    { username: "lager", discordId: "", discordUsername: "", name: "Sandra Lehmann", role: "Leiterin Lagerlogistik", roleKey: "lager", department: "Lager" },
    { username: "fuhrpark", discordId: "", discordUsername: "", name: "Jonas Petersen", role: "Leiter Fuhrparkmanagement", roleKey: "fuhrpark", department: "Fuhrpark & Werkstatt" },
    { username: "buchhaltung", discordId: "", discordUsername: "", name: "Dennis Kramer", role: "Leiter Buchhaltung", roleKey: "buchhaltung", department: "Finanzbuchhaltung" },
    ...driverRoster.map((name, i) => ({
      username: `fahrer${i + 1}`,
      discordId: "",
      discordUsername: "",
      name,
      role: roleLabels.fahrer,
      roleKey: "fahrer" as const,
      department: "Fahrbetrieb",
    })),
  ];
  return base.map((e) => ({ ...e, id: makeId(e.username) }));
}

export function seedDb(): Db {
  const employees = seedEmployees();
  return {
    vehicles: initialVehicles,
    orders: initialOrders.map((o) => ({ ...o, messages: [] })),
    driverCards: driverRoster.map((name) => ({
      driverName: name,
      active: false,
      drivingTodayMinutes: 0,
      drivingWeekMinutes: 0,
      onBreak: false,
      breakStartedAt: null,
      breakTakenTodayMinutes: 0,
      reminders: [],
    })),
    employees,
    personnelFiles: employees.map((e) => makeEmptyPersonnelFile(e.id)),
    stockItems: [],
    lastInventoryAt: null,
    trips: [],
    invoices: [],
    news: newsSeed,
    jobs: jobsSeed,
    services: servicesSeed,
    management: withIds(managementSeed, (m) => m.name),
    keyPositions: withIds(keyPositionsSeed, (m) => m.name),
    fleetCategories: withIds(fleetSeed, (f) => f.category),
    reviews: withIds(reviewsSeed, (r) => `${r.author}-${r.company}`),
    partners: withIds(partnersSeed, (p) => p.name),
    company: companySeed,
  };
}
