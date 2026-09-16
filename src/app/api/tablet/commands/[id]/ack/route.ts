import { isAuthorizedTabletRequest, unauthorizedTabletResponse } from "@/lib/server/tablet-auth";
import { resolveCommand } from "@/lib/server/store";

/** Tablet reports a command's execution result here after running it — see /api/tablet/commands. */
export async function POST(request: Request, ctx: RouteContext<"/api/tablet/commands/[id]/ack">) {
  if (!isAuthorizedTabletRequest(request)) return unauthorizedTabletResponse();

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const ok = body?.ok === true;
  const error = typeof body?.error === "string" ? body.error : undefined;

  const command = await resolveCommand(id, { ok, error });
  if (!command) return Response.json({ ok: false, error: "Befehl nicht gefunden." }, { status: 404 });
  return Response.json({ ok: true, command });
}
