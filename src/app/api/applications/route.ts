import { createApplication, getApplications } from "@/lib/server/store";

export async function GET() {
  const applications = await getApplications();
  return Response.json({ applications });
}

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) {
    return Response.json({ ok: false, error: "Ungültige Daten." }, { status: 400 });
  }

  const cvFile = form.get("cv");
  let cv: { fileName: string; mimeType: string; bytes: Uint8Array } | null = null;
  if (cvFile instanceof File && cvFile.size > 0) {
    cv = { fileName: cvFile.name, mimeType: cvFile.type, bytes: new Uint8Array(await cvFile.arrayBuffer()) };
  }

  try {
    const application = await createApplication({
      firstName: String(form.get("firstName") ?? ""),
      lastName: String(form.get("lastName") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      discordId: String(form.get("discordId") ?? ""),
      position: String(form.get("position") ?? ""),
      message: String(form.get("message") ?? ""),
      cv,
    });
    return Response.json({ ok: true, application }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bewerbung konnte nicht übermittelt werden.";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
