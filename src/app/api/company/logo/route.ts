import { getCompanyLogo, removeCompanyLogo, setCompanyLogo } from "@/lib/server/store";

export async function GET() {
  const logo = await getCompanyLogo();
  if (!logo) return Response.json({ ok: false, error: "Kein Logo hinterlegt." }, { status: 404 });
  return new Response(new Uint8Array(logo.bytes), {
    headers: { "Content-Type": logo.mimeType, "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
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
    const company = await setCompanyLogo(bytes, file.type || "application/octet-stream");
    return Response.json({ ok: true, company });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Logo konnte nicht hochgeladen werden.";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function DELETE() {
  const company = await removeCompanyLogo();
  return Response.json({ ok: true, company });
}
