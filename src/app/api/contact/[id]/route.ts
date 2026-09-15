import { getContactInquiry } from "@/lib/server/store";

export async function GET(_request: Request, ctx: RouteContext<"/api/contact/[id]">) {
  const { id } = await ctx.params;
  const inquiry = await getContactInquiry(id);
  if (!inquiry) return Response.json({ ok: false, error: "Anfrage nicht gefunden." }, { status: 404 });
  return Response.json({ inquiry });
}
