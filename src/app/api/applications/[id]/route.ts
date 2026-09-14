import { APPLICATION_STATUSES, APPLICATION_STATUSES_REQUIRING_SCHEDULE } from "@/lib/server/db-types";
import { getApplication, updateApplicationStatus } from "@/lib/server/store";
import { buildApplicationStatusDm, sendDiscordDm } from "@/lib/server/discord-bot";

export async function GET(_request: Request, ctx: RouteContext<"/api/applications/[id]">) {
  const { id } = await ctx.params;
  const application = await getApplication(id);
  if (!application) return Response.json({ ok: false, error: "Bewerbung nicht gefunden." }, { status: 404 });
  return Response.json({ application });
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/applications/[id]">) {
  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const status = body?.status;
  if (!APPLICATION_STATUSES.includes(status)) {
    return Response.json({ ok: false, error: "Ungültiger Status." }, { status: 400 });
  }

  let scheduledAt: string | null = null;
  if ((APPLICATION_STATUSES_REQUIRING_SCHEDULE as readonly string[]).includes(status)) {
    const raw = typeof body?.scheduledAt === "string" ? body.scheduledAt : "";
    const parsed = raw ? new Date(raw) : null;
    if (!parsed || Number.isNaN(parsed.getTime())) {
      return Response.json(
        { ok: false, error: "Datum und Uhrzeit sind für diesen Status erforderlich." },
        { status: 400 },
      );
    }
    scheduledAt = parsed.toISOString();
  }

  const application = await updateApplicationStatus(id, status, scheduledAt);
  if (!application) return Response.json({ ok: false, error: "Bewerbung nicht gefunden." }, { status: 404 });

  const discordDm = await sendDiscordDm(
    application.discordId,
    buildApplicationStatusDm({
      name: `${application.firstName} ${application.lastName}`,
      position: application.position,
      status: application.status,
      scheduledAt: application.scheduledAt,
    }),
  );

  return Response.json({ ok: true, application, discordDm });
}
