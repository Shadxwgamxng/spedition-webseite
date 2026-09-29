import { generateHrLetterPdf } from "@/lib/server/hr-letter-pdf";
import { buildTerminationDm, buildWarningDm, sendDiscordDmWithFile } from "@/lib/server/discord-bot";
import type { PersonnelFileRecord } from "@/lib/server/db-types";
import {
  addPersonnelDocument,
  addPersonnelTermination,
  addPersonnelWarning,
  getCompany,
  getCompanyLogo,
  getEmployeeById,
  getPersonnelFile,
} from "@/lib/server/store";

export type HrLetterGenerationResult = {
  generated: true;
  discordDm: Awaited<ReturnType<typeof sendDiscordDmWithFile>>;
  personnelFile: PersonnelFileRecord;
};

type HrLetterGenerationError = { generated: false; error: string };

/**
 * Generates an Abmahnung PDF from the entered Grund/Datum, stores it in the
 * employee's Akte (both as a document and as a structured warnings[] entry
 * for the "Verlauf" list), and sends it via Discord DM if they have a linked
 * account. Mirrors generateAndDistributeContract exactly.
 */
export async function generateAndDistributeWarning(
  employeeId: string,
  input: { date: string; reason: string; issuedBy: string; issuedByRole?: string },
): Promise<HrLetterGenerationResult | HrLetterGenerationError> {
  const [employee, personnelFile] = await Promise.all([getEmployeeById(employeeId), getPersonnelFile(employeeId)]);
  if (!employee) return { generated: false, error: "Mitarbeiter nicht gefunden." };
  if (!personnelFile) return { generated: false, error: "Personalakte nicht gefunden." };

  const [company, logo] = await Promise.all([getCompany(), getCompanyLogo()]);
  const pdfBytes = generateHrLetterPdf({
    kind: "abmahnung",
    company,
    employeeName: employee.name,
    file: personnelFile,
    logo,
    date: input.date,
    reason: input.reason,
    issuedBy: input.issuedBy,
    issuedByRole: input.issuedByRole,
  });
  const fileName = `Abmahnung_${employee.name.replace(/\s+/g, "_")}_${input.date}.pdf`;

  const document = await addPersonnelDocument(employeeId, { fileName, mimeType: "application/pdf", bytes: pdfBytes });
  await addPersonnelWarning(employeeId, { ...input, documentId: document.id });

  const discordDm = employee.discordId
    ? await sendDiscordDmWithFile(employee.discordId, buildWarningDm(employee.name), {
        fileName,
        mimeType: "application/pdf",
        bytes: pdfBytes,
      })
    : { ok: false as const, error: "Kein Discord-Account verknüpft." };

  const updatedFile = (await getPersonnelFile(employeeId)) ?? personnelFile;
  return { generated: true, discordDm, personnelFile: updatedFile };
}

/** Same as generateAndDistributeWarning, but for a Kündigung. */
export async function generateAndDistributeTermination(
  employeeId: string,
  input: {
    date: string;
    effectiveDate: string;
    terminationType: "ordentlich" | "fristlos";
    reason: string;
    issuedBy: string;
    issuedByRole?: string;
  },
): Promise<HrLetterGenerationResult | HrLetterGenerationError> {
  const [employee, personnelFile] = await Promise.all([getEmployeeById(employeeId), getPersonnelFile(employeeId)]);
  if (!employee) return { generated: false, error: "Mitarbeiter nicht gefunden." };
  if (!personnelFile) return { generated: false, error: "Personalakte nicht gefunden." };

  const [company, logo] = await Promise.all([getCompany(), getCompanyLogo()]);
  const pdfBytes = generateHrLetterPdf({
    kind: "kuendigung",
    company,
    employeeName: employee.name,
    file: personnelFile,
    logo,
    date: input.date,
    reason: input.reason,
    effectiveDate: input.effectiveDate,
    terminationType: input.terminationType,
    issuedBy: input.issuedBy,
    issuedByRole: input.issuedByRole,
  });
  const fileName = `Kuendigung_${employee.name.replace(/\s+/g, "_")}_${input.date}.pdf`;

  const document = await addPersonnelDocument(employeeId, { fileName, mimeType: "application/pdf", bytes: pdfBytes });
  await addPersonnelTermination(employeeId, { ...input, documentId: document.id });

  const discordDm = employee.discordId
    ? await sendDiscordDmWithFile(employee.discordId, buildTerminationDm(employee.name), {
        fileName,
        mimeType: "application/pdf",
        bytes: pdfBytes,
      })
    : { ok: false as const, error: "Kein Discord-Account verknüpft." };

  const updatedFile = (await getPersonnelFile(employeeId)) ?? personnelFile;
  return { generated: true, discordDm, personnelFile: updatedFile };
}
