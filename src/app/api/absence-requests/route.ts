import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/server/session";
import { sendAbsenceRequestChannelMessage } from "@/lib/server/discord-bot";
import {
  canApproveAbsenceRequests,
  createAbsenceRequest,
  getAbsenceRequestsForEmployee,
  getAllAbsenceRequests,
} from "@/lib/server/store";
import type { AbsenceRequestKind } from "@/lib/server/db-types";

/** Eigene Anträge, oder (Führung) die aller Mitarbeiter. */
export async function GET() {
  const cookieStore = await cookies();
  const user = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!user) return Response.json({ ok: false, error: "Nicht angemeldet." }, { status: 401 });

  const requests = canApproveAbsenceRequests(user.roleKey)
    ? await getAllAbsenceRequests()
    : await getAbsenceRequestsForEmployee(user.id);
  return Response.json({ ok: true, requests, isManager: canApproveAbsenceRequests(user.roleKey) });
}

/** Reicht eine Krankmeldung oder einen Urlaubsantrag für den angemeldeten Mitarbeiter ein. */
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const user = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!user) return Response.json({ ok: false, error: "Nicht angemeldet." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const kind: AbsenceRequestKind | null = body?.kind === "krankmeldung" || body?.kind === "urlaub" ? body.kind : null;
  const startDate = typeof body?.startDate === "string" ? body.startDate : "";
  const endDate = typeof body?.endDate === "string" ? body.endDate : "";
  const note = typeof body?.note === "string" ? body.note : "";

  if (!kind) {
    return Response.json({ ok: false, error: "Art (Krankmeldung/Urlaub) ist erforderlich." }, { status: 400 });
  }

  try {
    const record = await createAbsenceRequest({
      employeeId: user.id,
      employeeName: user.name,
      kind,
      startDate,
      endDate,
      note,
    });

    const discord = await sendAbsenceRequestChannelMessage({
      employeeName: user.name,
      kind,
      startDate,
      endDate,
    });

    return Response.json({ ok: true, request: record, discord });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Antrag konnte nicht eingereicht werden.";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
