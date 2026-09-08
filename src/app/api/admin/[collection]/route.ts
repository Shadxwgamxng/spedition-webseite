import { isCollectionName } from "@/lib/server/db-types";
import { createCollectionItem, listCollection } from "@/lib/server/store";

export async function GET(_request: Request, ctx: RouteContext<"/api/admin/[collection]">) {
  const { collection } = await ctx.params;
  if (!isCollectionName(collection)) {
    return Response.json({ ok: false, error: "Unbekannte Inhaltsart." }, { status: 400 });
  }
  const items = await listCollection(collection);
  return Response.json({ items });
}

export async function POST(request: Request, ctx: RouteContext<"/api/admin/[collection]">) {
  const { collection } = await ctx.params;
  if (!isCollectionName(collection)) {
    return Response.json({ ok: false, error: "Unbekannte Inhaltsart." }, { status: 400 });
  }
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ ok: false, error: "Ungültige Daten." }, { status: 400 });
  }
  const item = await createCollectionItem(collection, body as Record<string, unknown>);
  return Response.json({ ok: true, item }, { status: 201 });
}
