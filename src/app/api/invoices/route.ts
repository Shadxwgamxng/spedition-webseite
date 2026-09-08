import { createInvoice, getInvoices } from "@/lib/server/store";

export async function GET() {
  const invoices = await getInvoices();
  return Response.json({ invoices });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const customer = typeof body?.customer === "string" ? body.customer.trim() : "";
  const items = Array.isArray(body?.items) ? body.items : [];
  const total = Number(body?.total);

  const validItems = items.every(
    (item: unknown) =>
      item &&
      typeof item === "object" &&
      typeof (item as Record<string, unknown>).description === "string" &&
      Number.isFinite(Number((item as Record<string, unknown>).qty)) &&
      Number.isFinite(Number((item as Record<string, unknown>).price)),
  );

  if (!customer || items.length === 0 || !validItems || !Number.isFinite(total) || total <= 0) {
    return Response.json(
      { ok: false, error: "Kunde und mindestens eine gültige Position sind erforderlich." },
      { status: 400 },
    );
  }

  const invoice = await createInvoice({ customer, items, total });
  return Response.json({ ok: true, invoice }, { status: 201 });
}
