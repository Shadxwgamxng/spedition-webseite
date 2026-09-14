import { jsPDF } from "jspdf";
import type { CompanyInfo, PersonnelFileRecord } from "@/lib/server/db-types";

function logoFormat(dataUrl: string): "PNG" | "JPEG" | "WEBP" | null {
  const match = /^data:image\/(png|jpe?g|webp);base64,/i.exec(dataUrl);
  if (!match) return null;
  const ext = match[1].toLowerCase();
  if (ext === "png") return "PNG";
  if (ext === "webp") return "WEBP";
  return "JPEG";
}

function formatDate(value: string): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * Generates a generic Arbeitsvertrag (employment contract) PDF from company
 * letterhead data and a completed Personalakte. This is a template for a
 * fictive Spedition, not a legally vetted document — compensation is
 * deliberately left as "nach gesonderter Vereinbarung" since no salary field
 * exists (and none should be invented).
 */
export function generateContractPdf(input: {
  company: CompanyInfo;
  employeeName: string;
  roleLabel: string;
  department: string;
  file: PersonnelFileRecord;
}): Uint8Array {
  const { company, employeeName, roleLabel, department, file } = input;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const marginX = 20;
  const rightX = 190;
  let y = 20;

  const format = company.logoDataUrl ? logoFormat(company.logoDataUrl) : null;
  if (company.logoDataUrl && format) {
    try {
      doc.addImage(company.logoDataUrl, format, rightX - 25, y - 5, 25, 25, undefined, "FAST");
    } catch {
      // A malformed/unsupported logo image should never block contract generation.
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(company.name, marginX, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y += 6;
  doc.text(`${company.street}, ${company.zip} ${company.city}`, marginX, y);
  if (company.email || company.phone) {
    y += 5;
    doc.text([company.email, company.phone].filter(Boolean).join(" · "), marginX, y);
  }

  y += 16;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("Arbeitsvertrag", marginX, y);

  y += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("zwischen", marginX, y);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text(`${company.name}, ${company.street}, ${company.zip} ${company.city}`, marginX, y);
  doc.setFont("helvetica", "normal");
  y += 5;
  doc.text(`– im Folgenden „Arbeitgeber" genannt –`, marginX, y);

  y += 8;
  doc.text("und", marginX, y);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text(employeeName, marginX, y);
  doc.setFont("helvetica", "normal");
  y += 5;
  const employeeAddress = [file.street, [file.zip, file.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  if (employeeAddress) {
    doc.text(employeeAddress, marginX, y);
    y += 5;
  }
  doc.text(`– im Folgenden „Arbeitnehmer" genannt –`, marginX, y);

  y += 12;

  const sections: Array<{ title: string; lines: string[] }> = [
    {
      title: "§ 1 Beginn des Arbeitsverhältnisses",
      lines: [`Das Arbeitsverhältnis beginnt am ${formatDate(file.hireDate)}.`],
    },
    {
      title: "§ 2 Tätigkeit und Einsatzort",
      lines: [
        `Der Arbeitnehmer wird als „${roleLabel}" in der Abteilung „${department}" beschäftigt.`,
        `Einsatzort ist ${company.city}, vorbehaltlich anderslautender betrieblicher Anordnung.`,
      ],
    },
    {
      title: "§ 3 Arbeitszeit",
      lines: ["Die Arbeitszeit richtet sich nach den betrieblichen Erfordernissen des Arbeitgebers."],
    },
    {
      title: "§ 4 Vergütung",
      lines: ["Die Vergütung erfolgt nach gesonderter Vereinbarung zwischen den Vertragsparteien."],
    },
    {
      title: "§ 5 Urlaub",
      lines: ["Der Arbeitnehmer hat Anspruch auf den gesetzlichen Mindesturlaub pro Kalenderjahr."],
    },
    {
      title: "§ 6 Kündigung",
      lines: ["Für die Kündigung dieses Vertrags gelten die gesetzlichen Kündigungsfristen."],
    },
    {
      title: "§ 7 Schlussbestimmungen",
      lines: [
        "Änderungen und Ergänzungen dieses Vertrags bedürfen der Schriftform.",
        "Sollte eine Bestimmung dieses Vertrags unwirksam sein, bleibt der Vertrag im Übrigen wirksam.",
      ],
    },
  ];

  doc.setFontSize(10);
  for (const section of sections) {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.text(section.title, marginX, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    for (const line of section.lines) {
      const wrapped = doc.splitTextToSize(line, rightX - marginX);
      doc.text(wrapped, marginX, y);
      y += wrapped.length * 5 + 2;
    }
    y += 4;
  }

  if (y > 250) {
    doc.addPage();
    y = 20;
  }
  y += 10;
  doc.text(`${company.city}, den ${new Date().toLocaleDateString("de-DE")}`, marginX, y);
  y += 20;
  doc.line(marginX, y, marginX + 70, y);
  doc.line(rightX - 70, y, rightX, y);
  y += 5;
  doc.setFontSize(9);
  doc.text("Arbeitgeber", marginX, y);
  doc.text("Arbeitnehmer", rightX - 70, y);

  return new Uint8Array(doc.output("arraybuffer"));
}
