import {
  acknowledgeDriverReminder,
  endDriverBreak,
  getDriverCards,
  sendDriverReminder,
  setDriverCardActive,
  startDriverBreak,
} from "@/lib/server/store";

export async function GET() {
  const driverCards = await getDriverCards();
  return Response.json({ driverCards });
}

type Action = "activate" | "deactivate" | "break-start" | "break-end" | "remind" | "ack-reminder";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const action = body?.action as Action | undefined;
  const employeeId = typeof body?.employeeId === "string" ? body.employeeId : null;

  if (!action || !employeeId) {
    return Response.json({ ok: false, error: "action und employeeId sind erforderlich." }, { status: 400 });
  }

  let card = null;
  switch (action) {
    case "activate":
      card = await setDriverCardActive(employeeId, true);
      break;
    case "deactivate":
      card = await setDriverCardActive(employeeId, false);
      break;
    case "break-start":
      card = await startDriverBreak(employeeId);
      break;
    case "break-end":
      card = await endDriverBreak(employeeId);
      break;
    case "remind": {
      const text = typeof body?.text === "string" && body.text.trim() ? body.text.trim() : null;
      if (!text) return Response.json({ ok: false, error: "text ist erforderlich." }, { status: 400 });
      card = await sendDriverReminder(employeeId, text);
      break;
    }
    case "ack-reminder": {
      const reminderId = typeof body?.reminderId === "string" ? body.reminderId : null;
      if (!reminderId) return Response.json({ ok: false, error: "reminderId ist erforderlich." }, { status: 400 });
      card = await acknowledgeDriverReminder(employeeId, reminderId);
      break;
    }
    default:
      return Response.json({ ok: false, error: "Unbekannte Aktion." }, { status: 400 });
  }

  if (!card) return Response.json({ ok: false, error: "Fahrerkarte nicht gefunden." }, { status: 404 });
  return Response.json({ ok: true, card });
}
