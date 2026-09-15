import { createContactInquiry, getContactInquiries } from "@/lib/server/store";

export async function GET() {
  const inquiries = await getContactInquiries();
  return Response.json({ inquiries });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ ok: false, error: "Ungültige Daten." }, { status: 400 });
  }

  try {
    const inquiry = await createContactInquiry({
      name: String(body.name ?? ""),
      company: String(body.company ?? ""),
      email: String(body.email ?? ""),
      phone: String(body.phone ?? ""),
      discordId: String(body.discordId ?? ""),
      message: String(body.message ?? ""),
    });
    return Response.json({ ok: true, inquiry }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nachricht konnte nicht übermittelt werden.";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
