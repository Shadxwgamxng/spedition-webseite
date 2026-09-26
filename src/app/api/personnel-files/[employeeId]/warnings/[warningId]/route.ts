import { deletePersonnelWarning } from "@/lib/server/store";

/** Deletes an Abmahnung (and its generated PDF, if any) from the Akte. */
export async function DELETE(_request: Request, ctx: RouteContext<"/api/personnel-files/[employeeId]/warnings/[warningId]">) {
  const { employeeId, warningId } = await ctx.params;
  const ok = await deletePersonnelWarning(employeeId, warningId);
  if (!ok) return Response.json({ ok: false, error: "Eintrag nicht gefunden." }, { status: 404 });
  return Response.json({ ok: true });
}
