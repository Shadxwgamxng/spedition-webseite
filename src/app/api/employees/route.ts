import { isRoleKey } from "@/lib/roles";
import { createEmployee, getEmployees } from "@/lib/server/store";

export async function GET() {
  const employees = await getEmployees();
  return Response.json({ employees });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const roleKey = typeof body?.roleKey === "string" ? body.roleKey : "";
  const department = typeof body?.department === "string" ? body.department.trim() : "";

  if (!username || !password || !name || !department) {
    return Response.json(
      { ok: false, error: "Benutzername, Passwort, Name und Abteilung sind erforderlich." },
      { status: 400 },
    );
  }
  if (!isRoleKey(roleKey)) {
    return Response.json({ ok: false, error: "Ungültige Rolle." }, { status: 400 });
  }

  try {
    const employee = await createEmployee({ username, password, name, roleKey, department });
    return Response.json({ ok: true, employee }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Konto konnte nicht erstellt werden.";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
