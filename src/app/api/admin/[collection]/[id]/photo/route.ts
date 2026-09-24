import { isCmsCollection } from "@/lib/server/db-types";
import { getCollectionItemPhoto, removeCollectionItemPhoto, setCollectionItemPhoto } from "@/lib/server/store";

export async function GET(_request: Request, ctx: RouteContext<"/api/admin/[collection]/[id]/photo">) {
  const { collection, id } = await ctx.params;
  if (!isCmsCollection(collection)) {
    return Response.json({ ok: false, error: "Unbekannte Inhaltsart." }, { status: 400 });
  }
  const photo = await getCollectionItemPhoto(collection, decodeURIComponent(id));
  if (!photo) return Response.json({ ok: false, error: "Kein Foto hinterlegt." }, { status: 404 });
  return new Response(new Uint8Array(photo.bytes), {
    headers: { "Content-Type": photo.mimeType, "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request, ctx: RouteContext<"/api/admin/[collection]/[id]/photo">) {
  const { collection, id } = await ctx.params;
  if (!isCmsCollection(collection)) {
    return Response.json({ ok: false, error: "Unbekannte Inhaltsart." }, { status: 400 });
  }
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!form || !(file instanceof File)) {
    return Response.json({ ok: false, error: "Keine Datei übermittelt." }, { status: 400 });
  }
  if (file.size === 0) {
    return Response.json({ ok: false, error: "Die Datei ist leer." }, { status: 400 });
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const item = await setCollectionItemPhoto(collection, decodeURIComponent(id), bytes, file.type || "application/octet-stream");
    if (!item) return Response.json({ ok: false, error: "Eintrag nicht gefunden." }, { status: 404 });
    return Response.json({ ok: true, item });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Foto konnte nicht hochgeladen werden.";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/admin/[collection]/[id]/photo">) {
  const { collection, id } = await ctx.params;
  if (!isCmsCollection(collection)) {
    return Response.json({ ok: false, error: "Unbekannte Inhaltsart." }, { status: 400 });
  }
  const item = await removeCollectionItemPhoto(collection, decodeURIComponent(id));
  if (!item) return Response.json({ ok: false, error: "Eintrag nicht gefunden." }, { status: 404 });
  return Response.json({ ok: true, item });
}
