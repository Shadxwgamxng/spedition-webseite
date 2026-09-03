import { createOrder, getOrders } from "@/lib/server/store";

export async function GET() {
  const orders = await getOrders();
  return Response.json({ orders });
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const customer = str(body?.customer);
  const pickup = str(body?.pickup);
  const delivery = str(body?.delivery);
  const origin = body?.origin === "intern" ? "intern" : "web";
  const date = str(body?.date);
  const requestedPickupDate = str(body?.requestedPickupDate);

  if (!customer || !pickup || !delivery) {
    return Response.json({ ok: false, error: "Kunde, Abholung und Ziel sind erforderlich." }, { status: 400 });
  }
  if (origin === "intern" && !date) {
    return Response.json({ ok: false, error: "Termin ist erforderlich." }, { status: 400 });
  }
  if (origin === "web" && !requestedPickupDate) {
    return Response.json({ ok: false, error: "Wunschtermin Abholung ist erforderlich." }, { status: 400 });
  }

  const order = await createOrder({
    customer,
    pickup,
    delivery,
    date,
    notes: str(body?.notes),
    origin,
    contactName: str(body?.contactName),
    email: str(body?.email),
    phone: str(body?.phone),
    cargoType: str(body?.cargoType),
    requestedPickupDate,
    requestedDeliveryDate: str(body?.requestedDeliveryDate),
  });
  return Response.json({ ok: true, order }, { status: 201 });
}
