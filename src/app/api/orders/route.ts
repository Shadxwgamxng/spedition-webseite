import { createOrder, getOrders } from "@/lib/server/store";

export async function GET() {
  const orders = await getOrders();
  return Response.json({ orders });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const customer = typeof body?.customer === "string" ? body.customer.trim() : "";
  const pickup = typeof body?.pickup === "string" ? body.pickup.trim() : "";
  const delivery = typeof body?.delivery === "string" ? body.delivery.trim() : "";
  const date = typeof body?.date === "string" ? body.date : "";
  const notes = typeof body?.notes === "string" ? body.notes : "";

  if (!customer || !pickup || !delivery || !date) {
    return Response.json(
      { ok: false, error: "Kunde, Abholung, Ziel und Termin sind erforderlich." },
      { status: 400 },
    );
  }

  const order = await createOrder({ customer, pickup, delivery, date, notes });
  return Response.json({ ok: true, order }, { status: 201 });
}
