import { isPersonnelFileComplete, type PersonnelFileRecord } from "@/lib/server/db-types";
import { getPersonnelFile, updatePersonnelFile } from "@/lib/server/store";
import { generateAndDistributeContract, type ContractGenerationResult } from "@/lib/server/contract-generation";

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

  let contract: ContractGenerationResult | { generated: false; error: string } | undefined;

  if (!personnelFile.contractGeneratedAt && isPersonnelFileComplete(personnelFile)) {
    const result = await generateAndDistributeContract(employeeId);
    contract = result;
    if (result.generated) {
      personnelFile = result.personnelFile;
    }
  }

  return Response.json({ ok: true, personnelFile, contract });
}
