import { deleteTrip } from "@/lib/server/store";

export async function DELETE(_request: Request, ctx: RouteContext<"/api/trips/[id]">) {
  const { id } = await ctx.params;
  const ok = await deleteTrip(decodeURIComponent(id));
  if (!ok) return Response.json({ ok: false, error: "Fahrt nicht gefunden." }, { status: 404 });
  return Response.json({ ok: true });
}
