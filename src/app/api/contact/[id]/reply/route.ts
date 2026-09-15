import { addContactReply, getContactInquiry } from "@/lib/server/store";
import { buildContactReplyDm, sendDiscordDm } from "@/lib/server/discord-bot";

export async function POST(request: Request, ctx: RouteContext<"/api/contact/[id]/reply">) {
  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const sentBy = typeof body?.sentBy === "string" && body.sentBy.trim() ? body.sentBy.trim() : "Baltic Freight GmbH";

  if (!text) {
    return Response.json({ ok: false, error: "Nachricht darf nicht leer sein." }, { status: 400 });
  }

  const inquiry = await getContactInquiry(id);
  if (!inquiry) return Response.json({ ok: false, error: "Anfrage nicht gefunden." }, { status: 404 });

  const discordDm = await sendDiscordDm(inquiry.discordId, buildContactReplyDm(inquiry.name, text));

  const updated = await addContactReply(id, { text, sentBy });
  return Response.json({ ok: true, inquiry: updated, discordDm });
}
