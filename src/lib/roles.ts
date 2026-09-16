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

export type DriverLicenseKey = "klasse_c" | "klasse_ce" | "gefahrgut" | "schwertransport";

/**
 * Führerscheinklassen/Sonderberechtigungen — mirrors Config.DriverPermissions
 * in the FiveM Speditions-Tablet (config.lua) key-for-key. Stored per
 * employee (EmployeeRecord.driverLicenses); for a tablet-linked account, an
 * edit here is pushed to the tablet's st_driver_permissions via the
 * `update_driver_permissions` command (see README "Tablet-Sync").
 */
export const driverLicenseLabels: Record<DriverLicenseKey, string> = {
  klasse_c: "Klasse C",
  klasse_ce: "Klasse CE",
  gefahrgut: "Gefahrgut",
  schwertransport: "Schwertransport",
};

export const driverLicenseKeys = Object.keys(driverLicenseLabels) as DriverLicenseKey[];

export function isDriverLicenseKey(value: string): value is DriverLicenseKey {
  return Object.prototype.hasOwnProperty.call(driverLicenseLabels, value);
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
 * `bewerbungen` (Bewerbungsportal) is limited the same way — Personal- und
 * Recruiting-Entscheidungen liegen bei denselben zwei Rollen.
 */
const GESCHAEFTSFUEHRUNG_MODULES = [
  "disposition",
  "lager",
  "fahrzeuge",
  "fahrtenbuch",
  "fahrerkarte",
  "rechnungen",
  "finanzen",
  "kundenstammbaum",
  "stempeluhr",
  "auftraege",
  "anfragen",
  "personalakten",
  "bewerbungen",
  "verwaltung",
];

/**
 * Which employee module routes (the segment under /mitarbeiter/) each role may
 * open. Enforced both for the sidebar (what's shown) and in DashboardShell
 * (what's actually reachable) — see `docs` note in dashboard-shell.tsx.
 *
 * "kundenstammbaum" and "anfragen" (Kontaktanfragen von /standort) are
 * deliberately limited to Geschäftsführung, Prokurist, Betriebsleitung and
 * Disposition (chefdisponent + disponent) — the customer-facing roles;
 * everyone else with Rechnungserstellung still just references a customer
 * from there, which reads the customer list directly rather than through
 * the Kundenstammbaum nav module.
 *
 * "stempeluhr" is on every role's list — everyone clocks in/out — but the
 * page itself only shows the all-employees overview to the same management
 * roles as Kundenstammbaum (see stempeluhr/page.tsx).
 */
export const roleModuleAccess: Record<RoleKey, string[]> = {
  geschaeftsfuehrung: GESCHAEFTSFUEHRUNG_MODULES,
  prokurist: GESCHAEFTSFUEHRUNG_MODULES,
  betriebsleiter: [
    "disposition",
    "lager",
    "fahrzeuge",
    "fahrtenbuch",
    "fahrerkarte",
    "kundenstammbaum",
    "anfragen",
    "stempeluhr",
  ],
  chefdisponent: ["disposition", "fahrzeuge", "fahrerkarte", "kundenstammbaum", "anfragen", "stempeluhr"],
  disponent: ["disposition", "kundenstammbaum", "anfragen", "stempeluhr"],
  lager: ["lager", "stempeluhr"],
  fuhrpark: ["fahrzeuge", "fahrtenbuch", "stempeluhr"],
  buchhaltung: ["rechnungen", "finanzen", "stempeluhr"],
  fahrer: ["fahrerkarte", "auftraege", "stempeluhr"],
};

/** Roles that see the all-employees overview on Stempeluhr and manage Kundenstammbaum. */
export const MANAGEMENT_ROLES: RoleKey[] = ["geschaeftsfuehrung", "prokurist", "betriebsleiter"];

export function canAccessModule(role: RoleKey, moduleKey: string): boolean {
  return roleModuleAccess[role]?.includes(moduleKey) ?? false;
}
