import { createCustomer, getCustomers } from "@/lib/server/store";

export async function GET() {
  const customers = await getCustomers();
  return Response.json({ customers });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ ok: false, error: "Ungültige Daten." }, { status: 400 });
  }

  try {
    const customer = await createCustomer({
      companyName: String(body.companyName ?? ""),
      contactName: String(body.contactName ?? ""),
      street: String(body.street ?? ""),
      zip: String(body.zip ?? ""),
      city: String(body.city ?? ""),
      email: String(body.email ?? ""),
      phone: String(body.phone ?? ""),
      notes: String(body.notes ?? ""),
    });
    return Response.json({ ok: true, customer }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kunde konnte nicht angelegt werden.";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
