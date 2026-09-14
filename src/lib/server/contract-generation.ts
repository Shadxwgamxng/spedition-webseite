import { generateContractPdf } from "@/lib/server/contract-pdf";
import { buildContractDm, sendDiscordDmWithFile } from "@/lib/server/discord-bot";
import type { PersonnelFileRecord } from "@/lib/server/db-types";
import {
  addPersonnelDocument,
  getCompany,
  getCompanyLogo,
  getEmployeeById,
  getPersonnelFile,
  updatePersonnelFile,
} from "@/lib/server/store";

export type ContractGenerationResult = {
  generated: true;
  discordDm: Awaited<ReturnType<typeof sendDiscordDmWithFile>>;
  personnelFile: PersonnelFileRecord;
};

/**
 * Generates an Arbeitsvertrag PDF for the given employee's current data
 * (role/department/Personalakte), stores it in their Akte, stamps
 * `contractGeneratedAt`, and sends it via Discord DM if they have a linked
 * account. Used both for the one-time automatic trigger (once the Akte is
 * complete) and for the manual "Arbeitsvertrag neu erstellen" action, so a
 * promotion or other change can be reflected in a fresh contract.
 */
export async function generateAndDistributeContract(
  employeeId: string,
): Promise<ContractGenerationResult | { generated: false; error: string }> {
  const [employee, personnelFile] = await Promise.all([getEmployeeById(employeeId), getPersonnelFile(employeeId)]);
  if (!employee) return { generated: false, error: "Mitarbeiter nicht gefunden." };
  if (!personnelFile) return { generated: false, error: "Personalakte nicht gefunden." };

  const [company, logo] = await Promise.all([getCompany(), getCompanyLogo()]);
  const pdfBytes = generateContractPdf({
    company,
    employeeName: employee.name,
    roleLabel: employee.role,
    department: employee.department,
    file: personnelFile,
    logo,
  });
  const dateSuffix = new Date().toISOString().slice(0, 10);
  const fileName = `Arbeitsvertrag_${employee.name.replace(/\s+/g, "_")}_${dateSuffix}.pdf`;

  await addPersonnelDocument(employeeId, { fileName, mimeType: "application/pdf", bytes: pdfBytes });
  await updatePersonnelFile(employeeId, { contractGeneratedAt: new Date().toISOString() });

  const discordDm = employee.discordId
    ? await sendDiscordDmWithFile(employee.discordId, buildContractDm(employee.name), {
        fileName,
        mimeType: "application/pdf",
        bytes: pdfBytes,
      })
    : { ok: false as const, error: "Kein Discord-Account verknüpft." };

  const updatedFile = (await getPersonnelFile(employeeId)) ?? personnelFile;
  return { generated: true, discordDm, personnelFile: updatedFile };
}
