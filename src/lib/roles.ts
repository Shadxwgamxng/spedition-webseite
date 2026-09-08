export type RoleKey = "geschaeftsfuehrung" | "disposition" | "lager" | "fuhrpark" | "buchhaltung" | "fahrer";

export const roleLabels: Record<RoleKey, string> = {
  geschaeftsfuehrung: "Geschäftsführung",
  disposition: "Disposition",
  lager: "Lager",
  fuhrpark: "Fuhrpark & Werkstatt",
  buchhaltung: "Buchhaltung",
  fahrer: "Fahrer",
};

/**
 * Which employee module routes (the segment under /mitarbeiter/) each role may
 * open. Enforced both for the sidebar (what's shown) and in DashboardShell
 * (what's actually reachable) — see `docs` note in dashboard-shell.tsx.
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
    "verwaltung",
  ],
  disposition: ["disposition", "fahrzeuge", "fahrerkarte"],
  lager: ["lager"],
  fuhrpark: ["fahrzeuge", "fahrtenbuch"],
  buchhaltung: ["rechnungen", "finanzen"],
  fahrer: ["fahrerkarte", "auftraege"],
};

export function canAccessModule(role: RoleKey, moduleKey: string): boolean {
  return roleModuleAccess[role]?.includes(moduleKey) ?? false;
}
