import { addPersonnelDocument } from "@/lib/server/store";

export async function POST(request: Request, ctx: RouteContext<"/api/personnel-files/[employeeId]/documents">) {
  const { employeeId } = await ctx.params;

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
    const document = await addPersonnelDocument(employeeId, {
      fileName: file.name,
      mimeType: file.type,
      bytes,
    });
    return Response.json({ ok: true, document }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Datei konnte nicht hochgeladen werden.";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
