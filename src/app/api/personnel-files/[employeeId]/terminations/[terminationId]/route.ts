import { deletePersonnelTermination } from "@/lib/server/store";

/** Deletes a Kündigung (and its generated PDF, if any) from the Akte. */
export async function DELETE(_request: Request, ctx: RouteContext<"/api/personnel-files/[employeeId]/terminations/[terminationId]">) {
  const { employeeId, terminationId } = await ctx.params;
  const ok = await deletePersonnelTermination(employeeId, terminationId);
  if (!ok) return Response.json({ ok: false, error: "Eintrag nicht gefunden." }, { status: 404 });
  return Response.json({ ok: true });
}
