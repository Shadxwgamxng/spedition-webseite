import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/server/session";
import { getNotificationsForUser, markNotificationsRead } from "@/lib/server/store";

export async function GET() {
  const cookieStore = await cookies();
  const user = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!user) return Response.json({ notifications: [] });
  const notifications = await getNotificationsForUser(user.roleKey, user.name);
  return Response.json({ notifications });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const user = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!user) return Response.json({ ok: false, error: "Nicht angemeldet." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const ids = Array.isArray(body?.ids) ? body.ids.filter((id: unknown): id is string => typeof id === "string") : [];
  await markNotificationsRead(ids, user.name);
  return Response.json({ ok: true });
}
