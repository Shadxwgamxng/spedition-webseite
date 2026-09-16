import { isAuthorizedTabletRequest, unauthorizedTabletResponse } from "@/lib/server/tablet-auth";
import { enqueueCommand, listPendingCommands } from "@/lib/server/store";

/**
 * Pull endpoint the Tablet's server/sv_website_bridge.lua polls every few
 * seconds (see README "Tablet-Sync") for Disposition-Aktionen the website
 * queued for a `origin: "tablet"` order/vehicle (Website → Tablet direction —
 * see disposition/page.tsx). GET returns unresolved commands; POST is used
 * internally by other website routes (not the Tablet) to enqueue a new one.
 */

export async function GET(request: Request) {
  if (!isAuthorizedTabletRequest(request)) return unauthorizedTabletResponse();
  const commands = await listPendingCommands();
  return Response.json({ commands });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const type = typeof body?.type === "string" ? body.type.trim() : "";
  const data = (body?.data ?? {}) as Record<string, unknown>;
  if (!type) return Response.json({ ok: false, error: "type ist erforderlich." }, { status: 400 });
  const command = await enqueueCommand(type, data);
  return Response.json({ ok: true, command }, { status: 201 });
}
