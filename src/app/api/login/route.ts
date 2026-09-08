import { verifyEmployeeLogin } from "@/lib/server/store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!username || !password) {
    return Response.json({ ok: false, error: "Benutzername und Passwort sind erforderlich." }, { status: 400 });
  }

  const user = await verifyEmployeeLogin(username, password);
  if (!user) {
    return Response.json({ ok: false, error: "Benutzername oder Passwort ist falsch." }, { status: 401 });
  }
  return Response.json({ ok: true, user });
}
