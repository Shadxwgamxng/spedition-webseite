import type { CustomerRecord } from "@/lib/server/db-types";
import { deleteCustomer, updateCustomer } from "@/lib/server/store";

const TEXT_FIELDS = ["companyName", "contactName", "street", "zip", "city", "email", "phone", "notes", "discordId"] as const;

export async function PATCH(request: Request, ctx: RouteContext<"/api/customers/[id]">) {
  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ ok: false, error: "Ungültige Daten." }, { status: 400 });
  }

  const patch: Partial<Pick<CustomerRecord, (typeof TEXT_FIELDS)[number] | "portalEnabled">> = {};
  for (const key of TEXT_FIELDS) {
    if (typeof body[key] === "string") patch[key] = body[key];
  }
  if (typeof body.portalEnabled === "boolean") patch.portalEnabled = body.portalEnabled;

  try {
    const customer = await updateCustomer(id, patch);
    if (!customer) return Response.json({ ok: false, error: "Kunde nicht gefunden." }, { status: 404 });
    return Response.json({ ok: true, customer });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kunde konnte nicht aktualisiert werden.";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/customers/[id]">) {
  const { id } = await ctx.params;
  const ok = await deleteCustomer(id);
  if (!ok) return Response.json({ ok: false, error: "Kunde nicht gefunden." }, { status: 404 });
  return Response.json({ ok: true });
}
