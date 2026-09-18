import { getTabletFinance, resetTabletFinance } from "@/lib/server/store";

/**
 * Firmenkonto-Saldo und -Buchungen aus dem Tablet, gepusht via
 * /api/tablet/webhook (Event 'finance.transaction'). Grundlage für den
 * "Ingame-Umsatz"-Abschnitt auf der Finanzbuchhaltung-Seite.
 */
export async function GET() {
  const data = await getTabletFinance();
  return Response.json(data);
}

/** Löscht den gespiegelten Ingame-Umsatz komplett (siehe resetTabletFinance in store.ts) — z. B. nach einem Serverumzug mit neuer Tablet-Datenbank. */
export async function DELETE() {
  await resetTabletFinance();
  return Response.json({ ok: true });
}
