import { deleteStockItem } from "@/lib/server/store";

export async function DELETE(_request: Request, ctx: RouteContext<"/api/stock/[id]">) {
  const { id } = await ctx.params;
  const ok = await deleteStockItem(decodeURIComponent(id));
  if (!ok) return Response.json({ ok: false, error: "Artikel nicht gefunden." }, { status: 404 });
  return Response.json({ ok: true });
}
