import { generateAndDistributeTermination } from "@/lib/server/hr-letter-generation";

/** Creates a new Kündigung: generates the PDF, files it in the Akte, and DMs it if possible. */
export async function POST(request: Request, ctx: RouteContext<"/api/personnel-files/[employeeId]/terminations">) {
  const { employeeId } = await ctx.params;
  const body = await request.json().catch(() => null);
  const date = typeof body?.date === "string" ? body.date : "";
  const effectiveDate = typeof body?.effectiveDate === "string" ? body.effectiveDate : "";
  const terminationType = body?.terminationType === "fristlos" ? "fristlos" : "ordentlich";
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  const issuedBy = typeof body?.issuedBy === "string" ? body.issuedBy : "";
  const issuedByRole = typeof body?.issuedByRole === "string" ? body.issuedByRole : "";

  if (!date || !effectiveDate || !reason) {
    return Response.json({ ok: false, error: "Datum, Wirksam-zum und Grund sind erforderlich." }, { status: 400 });
  }

  const result = await generateAndDistributeTermination(employeeId, { date, effectiveDate, terminationType, reason, issuedBy, issuedByRole });
  if (!result.generated) {
    return Response.json({ ok: false, error: result.error }, { status: 404 });
  }
  return Response.json({ ok: true, personnelFile: result.personnelFile, letter: result });
}
