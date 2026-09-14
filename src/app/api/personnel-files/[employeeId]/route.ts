import { isPersonnelFileComplete, type PersonnelFileRecord } from "@/lib/server/db-types";
import { addPersonnelDocument, getCompany, getEmployeeById, getPersonnelFile, updatePersonnelFile } from "@/lib/server/store";
import { buildContractDm, sendDiscordDmWithFile } from "@/lib/server/discord-bot";
import { generateContractPdf } from "@/lib/server/contract-pdf";

const TEXT_FIELDS: (keyof Omit<PersonnelFileRecord, "id" | "employeeId" | "documents" | "contractGeneratedAt">)[] = [
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

  let personnelFile = await updatePersonnelFile(employeeId, patch);
  if (!personnelFile) return Response.json({ ok: false, error: "Personalakte nicht gefunden." }, { status: 404 });

  let contract: { generated: boolean; discordDm?: Awaited<ReturnType<typeof sendDiscordDmWithFile>> } | undefined;

  if (!personnelFile.contractGeneratedAt && isPersonnelFileComplete(personnelFile)) {
    const employee = await getEmployeeById(employeeId);
    if (employee) {
      const company = await getCompany();
      const pdfBytes = generateContractPdf({
        company,
        employeeName: employee.name,
        roleLabel: employee.role,
        department: employee.department,
        file: personnelFile,
      });
      const fileName = `Arbeitsvertrag_${employee.name.replace(/\s+/g, "_")}.pdf`;

      await addPersonnelDocument(employeeId, { fileName, mimeType: "application/pdf", bytes: pdfBytes });
      await updatePersonnelFile(employeeId, { contractGeneratedAt: new Date().toISOString() });

      const discordDm = employee.discordId
        ? await sendDiscordDmWithFile(employee.discordId, buildContractDm(employee.name), {
            fileName,
            mimeType: "application/pdf",
            bytes: pdfBytes,
          })
        : { ok: false as const, error: "Kein Discord-Account verknüpft." };

      contract = { generated: true, discordDm };
      personnelFile = (await getPersonnelFile(employeeId)) ?? personnelFile;
    }
  }

  return Response.json({ ok: true, personnelFile, contract });
}
