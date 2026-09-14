import { clockIn, clockOut, getTimeClockSummaries } from "@/lib/server/store";

export async function GET() {
  const summaries = await getTimeClockSummaries();
  return Response.json({ summaries });
}

type Action = "clock-in" | "clock-out";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const action = body?.action as Action | undefined;
  const employeeId = typeof body?.employeeId === "string" ? body.employeeId : null;

  if (!employeeId || (action !== "clock-in" && action !== "clock-out")) {
    return Response.json({ ok: false, error: "employeeId und action sind erforderlich." }, { status: 400 });
  }

  try {
    const entry = action === "clock-in" ? await clockIn(employeeId) : await clockOut(employeeId);
    return Response.json({ ok: true, entry });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Aktion fehlgeschlagen.";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
