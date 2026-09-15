import { cookies } from "next/headers";
import { CUSTOMER_SESSION_COOKIE, verifyCustomerSessionToken } from "@/lib/server/session";
import { createOrder, getOrdersForCustomer } from "@/lib/server/store";

/**
 * Scoped to the logged-in Bestandskunde only — unlike the rest of this app's
 * employee-facing API (trusted-internal-users, no server-side auth by
 * design, see README), a customer is an external party who must never see
 * another customer's or an anonymous web submitter's orders. The session is
 * therefore verified here server-side from the httpOnly cookie, not just
 * gated client-side.
 */
async function requireCustomer() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;
  return verifyCustomerSessionToken(token);
}

export async function GET() {
  const customer = await requireCustomer();
  if (!customer) return Response.json({ ok: false, error: "Nicht angemeldet." }, { status: 401 });
  const orders = await getOrdersForCustomer(customer.id);
  return Response.json({ orders });
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const customer = await requireCustomer();
  if (!customer) return Response.json({ ok: false, error: "Nicht angemeldet." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const pickup = str(body?.pickup);
  const delivery = str(body?.delivery);
  const requestedPickupDate = str(body?.requestedPickupDate);

  if (!pickup || !delivery) {
    return Response.json({ ok: false, error: "Abholung und Ziel sind erforderlich." }, { status: 400 });
  }
  if (!requestedPickupDate) {
    return Response.json({ ok: false, error: "Wunschtermin Abholung ist erforderlich." }, { status: 400 });
  }

  const order = await createOrder({
    customer: customer.companyName,
    customerId: customer.id,
    origin: "kunde",
    pickup,
    delivery,
    notes: str(body?.notes),
    contactName: customer.contactName,
    email: customer.email,
    phone: customer.phone,
    cargoType: str(body?.cargoType),
    requestedPickupDate,
    requestedDeliveryDate: str(body?.requestedDeliveryDate),
  });
  return Response.json({ ok: true, order }, { status: 201 });
}
