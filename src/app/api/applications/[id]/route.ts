import { APPLICATION_STATUSES } from "@/lib/server/db-types";
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

  const application = await updateApplicationStatus(id, status);
  if (!application) return Response.json({ ok: false, error: "Bewerbung nicht gefunden." }, { status: 404 });

  const discordDm = await sendDiscordDm(
    application.discordId,
    buildApplicationStatusDm({
      name: `${application.firstName} ${application.lastName}`,
      position: application.position,
      status: application.status,
    }),
  );

  return Response.json({ ok: true, application, discordDm });
}
