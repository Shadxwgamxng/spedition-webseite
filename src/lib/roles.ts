export type RoleKey =
  | "geschaeftsfuehrung"
  | "prokurist"
  | "betriebsleiter"
  | "chefdisponent"
  | "disponent"
  | "lager"
  | "fuhrpark"
  | "buchhaltung"
  | "fahrer";

export const roleLabels: Record<RoleKey, string> = {
  geschaeftsfuehrung: "Geschäftsführer",
  prokurist: "Prokurist",
  betriebsleiter: "Betriebsleiter",
  chefdisponent: "Chefdisponent",
  disponent: "Disponent",
  lager: "Lager",
  fuhrpark: "Fuhrpark & Werkstatt",
  buchhaltung: "Buchhaltung",
  fahrer: "Fahrer",
};

export const roleKeys = Object.keys(roleLabels) as RoleKey[];

export function isRoleKey(value: string): value is RoleKey {
  return Object.prototype.hasOwnProperty.call(roleLabels, value);
}

/**
 * Full module access shared by Geschäftsführer and Prokurist — a Prokurist
 * has, by definition (§ 48 ff. HGB in the real world; here simply "gleiche
 * Rechte wie der Geschäftsführer"), identical authority, so both roles are
 * kept pointing at the same list rather than two lists that could drift.
 *
 * `personalakten` is deliberately limited to these two roles: of everyone in
 * the company, they're the only ones whose responsibilities explicitly
 * include Personalentscheidungen, and the data behind it (Geburtsdatum,
 * Adresse, IBAN, …) is far more sensitive than anything else in the app.
 */
const GESCHAEFTSFUEHRUNG_MODULES = [
  "disposition",
  "lager",
  "fahrzeuge",
  "fahrtenbuch",
  "fahrerkarte",
  "rechnungen",
  "finanzen",
  "auftraege",
  "personalakten",
  "verwaltung",
];

/**
 * Which employee module routes (the segment under /mitarbeiter/) each role may
 * open. Enforced both for the sidebar (what's shown) and in DashboardShell
 * (what's actually reachable) — see `docs` note in dashboard-shell.tsx.
 */
export const roleModuleAccess: Record<RoleKey, string[]> = {
  geschaeftsfuehrung: GESCHAEFTSFUEHRUNG_MODULES,
  prokurist: GESCHAEFTSFUEHRUNG_MODULES,
  betriebsleiter: ["disposition", "lager", "fahrzeuge", "fahrtenbuch", "fahrerkarte"],
  chefdisponent: ["disposition", "fahrzeuge", "fahrerkarte"],
  disponent: ["disposition"],
  lager: ["lager"],
  fuhrpark: ["fahrzeuge", "fahrtenbuch"],
  buchhaltung: ["rechnungen", "finanzen"],
  fahrer: ["fahrerkarte", "auftraege"],
};

export function canAccessModule(role: RoleKey, moduleKey: string): boolean {
  return roleModuleAccess[role]?.includes(moduleKey) ?? false;
}
