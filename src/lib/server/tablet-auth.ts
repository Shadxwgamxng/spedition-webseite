import { timingSafeEqual } from "node:crypto";

/**
 * Shared auth check for the /api/tablet/* routes (see README "Tablet-Sync") —
 * the only routes in this app with a real API-key gate, since they accept
 * writes from an external, non-interactive caller (the FiveM game server)
 * rather than a logged-in browser session. Constant-time comparison, same
 * pattern as the session-cookie checks in src/lib/server/session.ts.
 *
 * Fails closed: if `TABLET_API_KEY` isn't set, every request is rejected —
 * the Tablet-Sync feature is simply unavailable rather than silently open.
 */
export function isAuthorizedTabletRequest(request: Request): boolean {
  const expected = process.env.TABLET_API_KEY;
  if (!expected) return false;

  const provided = request.headers.get("x-api-key") ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function unauthorizedTabletResponse(): Response {
  return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
}
