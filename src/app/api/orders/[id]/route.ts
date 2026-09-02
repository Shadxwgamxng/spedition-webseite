import { addOrderMessage, updateOrder } from "@/lib/server/store";
import type { OrderStatus } from "@/lib/fleet-data";

const VALID_STATUSES: OrderStatus[] = ["Neu", "Disponiert", "Unterwegs", "Zugestellt"];

export async function PATCH(request: Request, ctx: RouteContext<"/api/orders/[id]">) {
  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);

  const patch: { status?: OrderStatus; driverName?: string | null; vehiclePlate?: string | null } = {};

  if (typeof body?.status === "string") {
    if (!VALID_STATUSES.includes(body.status as OrderStatus)) {
      return Response.json({ ok: false, error: "Ungültiger Status." }, { status: 400 });
    }
    patch.status = body.status as OrderStatus;
  }
  if (body && "driverName" in body) {
    patch.driverName = typeof body.driverName === "string" ? body.driverName : null;
  }
  if (body && "vehiclePlate" in body) {
    patch.vehiclePlate = typeof body.vehiclePlate === "string" ? body.vehiclePlate : null;
  }

  const order = await updateOrder(id, patch);
  if (!order) {
    return Response.json({ ok: false, error: "Auftrag nicht gefunden." }, { status: 404 });
  }
  return Response.json({ ok: true, order });
}

export async function POST(request: Request, ctx: RouteContext<"/api/orders/[id]">) {
  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);

  const from = body?.from === "driver" || body?.from === "dispo" ? body.from : null;
  const authorName = typeof body?.authorName === "string" ? body.authorName.trim() : "";
  const text = typeof body?.text === "string" ? body.text.trim() : "";

  if (!from || !authorName || !text) {
    return Response.json({ ok: false, error: "from, authorName und text sind erforderlich." }, { status: 400 });
  }

  const order = await addOrderMessage(id, { from, authorName, text });
  if (!order) {
    return Response.json({ ok: false, error: "Auftrag nicht gefunden." }, { status: 404 });
  }
  return Response.json({ ok: true, order });
}
