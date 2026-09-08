import { isRoleKey, type RoleKey } from "@/lib/roles";
import { deleteEmployee, updateEmployee } from "@/lib/server/store";

export async function PATCH(request: Request, ctx: RouteContext<"/api/employees/[id]">) {
  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ ok: false, error: "Ungültige Daten." }, { status: 400 });
  }

  const patch: {
    username?: string;
    discordId?: string;
    discordUsername?: string;
    name?: string;
    roleKey?: RoleKey;
    department?: string;
  } = {};

  if (typeof body.username === "string") patch.username = body.username;
  if (typeof body.discordId === "string") patch.discordId = body.discordId;
  if (typeof body.discordUsername === "string") patch.discordUsername = body.discordUsername;
  if (typeof body.name === "string") patch.name = body.name;
  if (typeof body.department === "string") patch.department = body.department;
  if (typeof body.roleKey === "string") {
    if (!isRoleKey(body.roleKey)) {
      return Response.json({ ok: false, error: "Ungültige Rolle." }, { status: 400 });
    }
    patch.roleKey = body.roleKey;
  }

  try {
    const employee = await updateEmployee(id, patch);
    if (!employee) return Response.json({ ok: false, error: "Konto nicht gefunden." }, { status: 404 });
    return Response.json({ ok: true, employee });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Konto konnte nicht aktualisiert werden.";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/employees/[id]">) {
  const { id } = await ctx.params;
  const ok = await deleteEmployee(id);
  if (!ok) return Response.json({ ok: false, error: "Konto nicht gefunden." }, { status: 404 });
  return Response.json({ ok: true });
}
