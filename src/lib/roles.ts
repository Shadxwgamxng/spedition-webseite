export type RoleKey =
  | "geschaeftsfuehrung"
  | "betriebsleiter"
  | "chefdisponent"
  | "disponent"
  | "lager"
  | "fuhrpark"
  | "buchhaltung"
  | "fahrer";

export const roleLabels: Record<RoleKey, string> = {
  geschaeftsfuehrung: "Geschäftsführer",
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
 * Which employee module routes (the segment under /mitarbeiter/) each role may
 * open. Enforced both for the sidebar (what's shown) and in DashboardShell
 * (what's actually reachable) — see `docs` note in dashboard-shell.tsx.
 *
 * `personalakten` is deliberately Geschäftsführer-only: it's the only role
 * whose responsibilities explicitly include Personalentscheidungen, and the
 * data behind it (Geburtsdatum, IBAN, Steuer-ID, Sozialversicherungsnummer, …)
 * is far more sensitive than anything else in the app.
 */
export const roleModuleAccess: Record<RoleKey, string[]> = {
  geschaeftsfuehrung: [
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
  ],
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
