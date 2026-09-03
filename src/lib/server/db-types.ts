import {
  company as companySeed,
  services as servicesSeed,
  management as managementSeed,
  keyPositions as keyPositionsSeed,
  news as newsSeed,
  jobs as jobsSeed,
  reviews as reviewsSeed,
  partners as partnersSeed,
  fleet as fleetSeed,
  type Service,
  type TeamMember,
  type NewsPost,
  type Job,
  type Review,
  type Partner,
  type FleetVehicle,
} from "@/lib/data";

export type CompanyInfo = typeof companySeed;
export type WithId<T> = T & { id: string };
export type TeamMemberRecord = WithId<TeamMember>;
export type FleetCategoryRecord = WithId<FleetVehicle>;
export type ReviewRecord = WithId<Review>;
export type PartnerRecord = WithId<Partner>;
export type ServiceRecord = Service; // slug already unique, used as id
export type NewsRecord = NewsPost; // slug already unique, used as id
export type JobRecord = Job; // slug already unique, used as id

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

export function seedDb(): Db {
  return {
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
