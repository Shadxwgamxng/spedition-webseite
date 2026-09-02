import { getCompany, updateCompany } from "@/lib/server/store";

export async function GET() {
  const company = await getCompany();
  return Response.json({ company });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ ok: false, error: "Ungültige Daten." }, { status: 400 });
  }
  const company = await updateCompany(body as Record<string, unknown>);
  return Response.json({ ok: true, company });
}
