import { getPersonnelFile, updatePersonnelFile } from "@/lib/server/store";
import type { PersonnelFileRecord } from "@/lib/server/db-types";

const TEXT_FIELDS: (keyof Omit<PersonnelFileRecord, "id" | "employeeId" | "documents">)[] = [
  "birthDate",
  "birthPlace",
  "nationality",
  "street",
  "zip",
  "city",
  "phonePrivate",
  "emailPrivate",
  "hireDate",
  "employmentType",
  "taxId",
  "socialSecurityNumber",
  "healthInsurance",
  "iban",
  "emergencyContactName",
  "emergencyContactPhone",
  "notes",
];

export async function GET(_request: Request, ctx: RouteContext<"/api/personnel-files/[employeeId]">) {
  const { employeeId } = await ctx.params;
  const personnelFile = await getPersonnelFile(employeeId);
  if (!personnelFile) return Response.json({ ok: false, error: "Personalakte nicht gefunden." }, { status: 404 });
  return Response.json({ personnelFile });
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/personnel-files/[employeeId]">) {
  const { employeeId } = await ctx.params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ ok: false, error: "Ungültige Daten." }, { status: 400 });
  }

  const patch: Partial<Record<(typeof TEXT_FIELDS)[number], string>> = {};
  for (const key of TEXT_FIELDS) {
    if (typeof body[key] === "string") patch[key] = body[key];
  }

  const personnelFile = await updatePersonnelFile(employeeId, patch);
  if (!personnelFile) return Response.json({ ok: false, error: "Personalakte nicht gefunden." }, { status: 404 });
  return Response.json({ ok: true, personnelFile });
}
