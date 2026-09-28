import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/server/session";
import { getProcedures } from "@/lib/server/store";

/**
 * Lese-Endpunkt für "Verfahrensanweisungen" - jeder angemeldete Mitarbeiter
 * (egal welche Rolle) darf lesen, Schreiben/Bearbeiten/Löschen läuft
 * ausschließlich über die generische /api/admin/procedures-Route unter
 * Verwaltung (Geschäftsführung), s. verwaltung/page.tsx.
 */
export async function GET() {
  const cookieStore = await cookies();
  const user = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!user) return Response.json({ items: [] }, { status: 401 });
  const items = await getProcedures();
  return Response.json({ items });
}
