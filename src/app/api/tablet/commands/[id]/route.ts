import { getCommandById } from "@/lib/server/store";

/**
 * Status-Abfrage eines einzelnen Website→Tablet-Befehls (z.B. create_employee)
 * für das Frontend, das den Befehl selbst enqueued hat — damit ein
 * fehlgeschlagener Befehl (z.B. Rollen-Zuordnung im Tablet nicht eindeutig)
 * sichtbar wird, statt dass jemand erst beim erfolglosen Login im Spiel davon
 * erfährt. Kein Tablet-Endpunkt (kein isAuthorizedTabletRequest nötig) - wird
 * ausschließlich vom eigenen Frontend aufgerufen, siehe employee-manager.tsx.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/tablet/commands/[id]">) {
  const { id } = await ctx.params;
  const command = await getCommandById(id);
  if (!command) return Response.json({ ok: false, error: "Befehl nicht gefunden." }, { status: 404 });
  return Response.json({ ok: true, command });
}
