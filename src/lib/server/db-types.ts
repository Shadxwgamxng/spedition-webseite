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

export function seedDb(): Db {
  return {
    vehicles: initialVehicles,
    orders: initialOrders.map((o) => ({ ...o, messages: [] })),
    driverCards: driverRoster.map((name, i) => ({
      driverName: name,
      active: false,
      drivingTodayMinutes: [390, 252, 0, 468, 186][i] ?? 0,
      drivingWeekMinutes: [2280, 1740, 2640, 2460, 1320][i] ?? 0,
      onBreak: false,
      breakStartedAt: null,
      breakTakenTodayMinutes: [30, 15, 60, 20, 45][i] ?? 0,
      reminders: [],
    })),
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
