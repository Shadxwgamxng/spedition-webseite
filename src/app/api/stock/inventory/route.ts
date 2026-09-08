import { applyInventoryCounts } from "@/lib/server/store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const counts = body?.counts;
  if (!counts || typeof counts !== "object") {
    return Response.json({ ok: false, error: "Ungültige Daten." }, { status: 400 });
  }
  const items = await applyInventoryCounts(counts as Record<string, number>);
  return Response.json({ ok: true, items });
}
