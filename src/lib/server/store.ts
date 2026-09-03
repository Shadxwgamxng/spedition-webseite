import { promises as fs } from "node:fs";
import path from "node:path";
import {
  seedDb,
  type CollectionName,
  type CompanyInfo,
  type Db,
  type FleetCategoryRecord,
  type JobRecord,
  type NewsRecord,
  type PartnerRecord,
  type ReviewRecord,
  type ServiceRecord,
  type TeamMemberRecord,
} from "@/lib/server/db-types";

/**
 * File-backed JSON store standing in for a real database/CMS backend. It exists
 * so a content edit reaches the public site without a redeploy. Not
 * concurrency-safe, and resets if `.data/db.json` is deleted — fine for a
 * demo/single-instance deployment, not a substitute for a real database in
 * production.
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
  // version of this schema — otherwise reads of those collections would
  // return undefined and crash callers.
  const seed = seedDb();
  let changed = false;
  for (const key of Object.keys(seed) as (keyof Db)[]) {
    if (db[key] === undefined) {
      (db as Db)[key] = seed[key] as never;
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
// Generic collection read, backing the typed getters below.
// ---------------------------------------------------------------------------

async function listCollection<T = unknown>(name: CollectionName): Promise<T[]> {
  const db = await readDb();
  return db[name] as T[];
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
