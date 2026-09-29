import { generateAndDistributeWarning } from "@/lib/server/hr-letter-generation";

/** Creates a new Abmahnung: generates the PDF, files it in the Akte, and DMs it if possible. */
export async function POST(request: Request, ctx: RouteContext<"/api/personnel-files/[employeeId]/warnings">) {
  const { employeeId } = await ctx.params;
  const body = await request.json().catch(() => null);
  const date = typeof body?.date === "string" ? body.date : "";
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  const issuedBy = typeof body?.issuedBy === "string" ? body.issuedBy : "";
  const issuedByRole = typeof body?.issuedByRole === "string" ? body.issuedByRole : "";

  if (!date || !reason) {
    return Response.json({ ok: false, error: "Datum und Grund sind erforderlich." }, { status: 400 });
  }

  const result = await generateAndDistributeWarning(employeeId, { date, reason, issuedBy, issuedByRole });
  if (!result.generated) {
    return Response.json({ ok: false, error: result.error }, { status: 404 });
  }
  return Response.json({ ok: true, personnelFile: result.personnelFile, letter: result });
}
