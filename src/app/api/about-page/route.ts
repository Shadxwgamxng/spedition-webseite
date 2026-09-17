import { getAboutPage, updateAboutPage } from "@/lib/server/store";

export async function GET() {
  const aboutPage = await getAboutPage();
  return Response.json({ aboutPage });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ ok: false, error: "Ungültige Daten." }, { status: 400 });
  }
  const aboutPage = await updateAboutPage(body as Record<string, unknown>);
  return Response.json({ ok: true, aboutPage });
}
