import { deleteInvoice, updateInvoiceStatus } from "@/lib/server/store";

const VALID_STATUSES = ["Offen", "Bezahlt", "Überfällig"];

export async function PATCH(request: Request, ctx: RouteContext<"/api/invoices/[number]">) {
  const { number } = await ctx.params;
  const body = await request.json().catch(() => null);
  const status = body?.status;
  if (!VALID_STATUSES.includes(status)) {
    return Response.json({ ok: false, error: "Ungültiger Status." }, { status: 400 });
  }
  const invoice = await updateInvoiceStatus(decodeURIComponent(number), status);
  if (!invoice) return Response.json({ ok: false, error: "Rechnung nicht gefunden." }, { status: 404 });
  return Response.json({ ok: true, invoice });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/invoices/[number]">) {
  const { number } = await ctx.params;
  const ok = await deleteInvoice(decodeURIComponent(number));
  if (!ok) return Response.json({ ok: false, error: "Rechnung nicht gefunden." }, { status: 404 });
  return Response.json({ ok: true });
}
