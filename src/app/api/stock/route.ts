import { createStockItem, getStockItems } from "@/lib/server/store";

export async function GET() {
  const { items, lastInventoryAt } = await getStockItems();
  return Response.json({ items, lastInventoryAt });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const sku = typeof body?.sku === "string" ? body.sku.trim() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const location = typeof body?.location === "string" ? body.location.trim() : "";
  const unit = typeof body?.unit === "string" ? body.unit.trim() : "";
  const stock = Number(body?.stock);
  const minStock = Number(body?.minStock);

  if (!sku || !name || !location || !unit || !Number.isFinite(stock) || !Number.isFinite(minStock)) {
    return Response.json(
      { ok: false, error: "SKU, Name, Lagerort, Einheit, Bestand und Mindestbestand sind erforderlich." },
      { status: 400 },
    );
  }

  try {
    const item = await createStockItem({ sku, name, location, unit, stock, minStock });
    return Response.json({ ok: true, item }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Artikel konnte nicht angelegt werden.";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
