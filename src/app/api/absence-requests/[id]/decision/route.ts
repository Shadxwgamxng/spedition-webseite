import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/server/session";
import { canApproveAbsenceRequests, decideAbsenceRequest } from "@/lib/server/store";

/** Genehmigt/lehnt einen Urlaubsantrag ab — nur MANAGEMENT_ROLES (siehe canApproveAbsenceRequests). */
export async function POST(request: Request, ctx: RouteContext<"/api/absence-requests/[id]/decision">) {
  const cookieStore = await cookies();
  const user = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!user) return Response.json({ ok: false, error: "Nicht angemeldet." }, { status: 401 });
  if (!canApproveAbsenceRequests(user.roleKey)) {
    return Response.json({ ok: false, error: "Keine Berechtigung." }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const decision = body?.decision === "genehmigt" || body?.decision === "abgelehnt" ? body.decision : null;
  if (!decision) {
    return Response.json({ ok: false, error: "Entscheidung ist erforderlich." }, { status: 400 });
  }

  try {
    const record = await decideAbsenceRequest(id, decision, user.name);
    return Response.json({ ok: true, request: record });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Aktion fehlgeschlagen.";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
