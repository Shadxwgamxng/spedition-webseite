import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/server/session";
import { sendAbsenceRequestChannelMessage } from "@/lib/server/discord-bot";
import { deleteAbsenceRequest, updateAbsenceRequest } from "@/lib/server/store";

/** Bearbeitet den eigenen Antrag — ein Urlaubsantrag springt dabei zurück auf "eingereicht" und braucht erneute Genehmigung. */
export async function PATCH(request: Request, ctx: RouteContext<"/api/absence-requests/[id]">) {
  const cookieStore = await cookies();
  const user = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!user) return Response.json({ ok: false, error: "Nicht angemeldet." }, { status: 401 });

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const startDate = typeof body?.startDate === "string" ? body.startDate : "";
  const endDate = typeof body?.endDate === "string" ? body.endDate : "";
  const note = typeof body?.note === "string" ? body.note : "";

  try {
    const record = await updateAbsenceRequest(id, user.id, { startDate, endDate, note });

    const discord =
      record.kind === "urlaub"
        ? await sendAbsenceRequestChannelMessage({
            employeeName: user.name,
            kind: record.kind,
            startDate: record.startDate,
            endDate: record.endDate,
          })
        : null;

    return Response.json({ ok: true, request: record, discord });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Antrag konnte nicht bearbeitet werden.";
    const status = message === "Keine Berechtigung." ? 403 : 400;
    return Response.json({ ok: false, error: message }, { status });
  }
}

/** Löscht den eigenen Antrag. */
export async function DELETE(_request: Request, ctx: RouteContext<"/api/absence-requests/[id]">) {
  const cookieStore = await cookies();
  const user = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!user) return Response.json({ ok: false, error: "Nicht angemeldet." }, { status: 401 });

  const { id } = await ctx.params;
  try {
    await deleteAbsenceRequest(id, user.id);
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Antrag konnte nicht gelöscht werden.";
    const status = message === "Keine Berechtigung." ? 403 : 400;
    return Response.json({ ok: false, error: message }, { status });
  }
}
