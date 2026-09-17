import { getTabletFinance } from "@/lib/server/store";

/**
 * Firmenkonto-Saldo und -Buchungen aus dem Tablet, gepusht via
 * /api/tablet/webhook (Event 'finance.transaction'). Grundlage für den
 * "Ingame-Umsatz"-Abschnitt auf der Finanzbuchhaltung-Seite.
 */
export async function GET() {
  const data = await getTabletFinance();
  return Response.json(data);
}
