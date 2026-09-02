import { deleteVehicle } from "@/lib/server/store";

export async function DELETE(_request: Request, ctx: RouteContext<"/api/vehicles/[plate]">) {
  const { plate } = await ctx.params;
  const ok = await deleteVehicle(decodeURIComponent(plate));
  if (!ok) return Response.json({ ok: false, error: "Fahrzeug nicht gefunden." }, { status: 404 });
  return Response.json({ ok: true });
}
