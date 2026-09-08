import { isCmsCollection } from "@/lib/server/db-types";
import { deleteCollectionItem, updateCollectionItem } from "@/lib/server/store";

export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/[collection]/[id]">) {
  const { collection, id } = await ctx.params;
  if (!isCmsCollection(collection)) {
    return Response.json({ ok: false, error: "Unbekannte Inhaltsart." }, { status: 400 });
  }
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ ok: false, error: "Ungültige Daten." }, { status: 400 });
  }
  const item = await updateCollectionItem(collection, decodeURIComponent(id), body as Record<string, unknown>);
  if (!item) return Response.json({ ok: false, error: "Eintrag nicht gefunden." }, { status: 404 });
  return Response.json({ ok: true, item });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/admin/[collection]/[id]">) {
  const { collection, id } = await ctx.params;
  if (!isCmsCollection(collection)) {
    return Response.json({ ok: false, error: "Unbekannte Inhaltsart." }, { status: 400 });
  }
  const ok = await deleteCollectionItem(collection, decodeURIComponent(id));
  if (!ok) return Response.json({ ok: false, error: "Eintrag nicht gefunden." }, { status: 404 });
  return Response.json({ ok: true });
}
