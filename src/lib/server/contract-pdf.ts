import { jsPDF } from "jspdf";
import type { CompanyInfo, PersonnelFileRecord } from "@/lib/server/db-types";

// Same brand palette as the website (src/app/globals.css) — navy for text/
// structure, the signal-blue accent (sampled from the logo) for highlights.
const NAVY_900: [number, number, number] = [10, 28, 66];
const NAVY_700: [number, number, number] = [22, 59, 122];
const ACCENT: [number, number, number] = [0, 96, 160];
const BODY_GRAY: [number, number, number] = [51, 51, 51];
const RULE_GRAY: [number, number, number] = [210, 215, 222];

const MARGIN_X = 20;
const PAGE_RIGHT = 190;
const PAGE_BOTTOM = 272;

function logoFormat(mimeType: string): "PNG" | "JPEG" | "WEBP" | null {
  const match = /^image\/(png|jpe?g|webp)$/i.exec(mimeType);
  if (!match) return null;
  const ext = match[1].toLowerCase();
  if (ext === "png") return "PNG";
  if (ext === "webp") return "WEBP";
  return "JPEG";
}

/** Scales (naturalWidth × naturalHeight) down to fit inside a box, preserving aspect ratio. */
function fitInBox(naturalWidth: number, naturalHeight: number, maxWidth: number, maxHeight: number) {
  const scale = Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight, 1);
  return { width: naturalWidth * scale, height: naturalHeight * scale };
}

function formatDate(value: string): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function drawFooter(doc: jsPDF, company: CompanyInfo, page: number, pageCount: number) {
  doc.setDrawColor(...RULE_GRAY);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_X, 281, PAGE_RIGHT, 281);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 128, 140);
  doc.text(company.name, MARGIN_X, 286);
  doc.text(`Seite ${page} von ${pageCount}`, PAGE_RIGHT, 286, { align: "right" });
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
  logo?: { bytes: Uint8Array; mimeType: string } | null;
}): Uint8Array {
  const { company, employeeName, roleLabel, department, file, logo } = input;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = 20;

  // --- Letterhead: logo (aspect-ratio preserved) left, company details right ---
  const format = logo ? logoFormat(logo.mimeType) : null;
  let headerBottom = y + 16;
  if (logo && format) {
    try {
      const logoDataUrl = `data:${logo.mimeType};base64,${Buffer.from(logo.bytes).toString("base64")}`;
      const props = doc.getImageProperties(logoDataUrl);
      const { width, height } = fitInBox(props.width, props.height, 55, 20);
      doc.addImage(logoDataUrl, format, MARGIN_X, y - 4, width, height, undefined, "FAST");
      headerBottom = Math.max(headerBottom, y - 4 + height + 4);
    } catch {
      // A malformed/unsupported logo image should never block contract generation.
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...NAVY_900);
  doc.text(company.name, PAGE_RIGHT, y, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BODY_GRAY);
  y += 5;
  doc.text(`${company.street}, ${company.zip} ${company.city}`, PAGE_RIGHT, y, { align: "right" });
  if (company.email || company.phone) {
    y += 4.5;
    doc.text([company.email, company.phone].filter(Boolean).join(" · "), PAGE_RIGHT, y, { align: "right" });
  }

  // Two-tone accent rule under the letterhead, echoing the logo's dark/blue split.
  y = headerBottom + 4;
  doc.setDrawColor(...NAVY_900);
  doc.setLineWidth(1.1);
  doc.line(MARGIN_X, y, PAGE_RIGHT - 30, y);
  doc.setDrawColor(...ACCENT);
  doc.line(PAGE_RIGHT - 30, y, PAGE_RIGHT, y);

  // --- Title ---
  y += 12;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...NAVY_900);
  doc.text("Arbeitsvertrag", MARGIN_X, y);
  y += 2.5;
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(1);
  doc.line(MARGIN_X, y, MARGIN_X + 24, y);

  // --- Vertragsparteien ---
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...BODY_GRAY);
  doc.text("zwischen", MARGIN_X, y);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY_900);
  doc.text(`${company.name}, ${company.street}, ${company.zip} ${company.city}`, MARGIN_X, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BODY_GRAY);
  y += 5;
  doc.text(`– im Folgenden „Arbeitgeber" genannt –`, MARGIN_X, y);

  y += 8;
  doc.text("und", MARGIN_X, y);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY_900);
  doc.text(employeeName, MARGIN_X, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BODY_GRAY);
  y += 5;
  const employeeAddress = [file.street, [file.zip, file.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  if (employeeAddress) {
    doc.text(employeeAddress, MARGIN_X, y);
    y += 5;
  }
  doc.text(`– im Folgenden „Arbeitnehmer" genannt –`, MARGIN_X, y);

  y += 6;
  doc.setDrawColor(...RULE_GRAY);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_X, y, PAGE_RIGHT, y);
  y += 10;

  // --- Sections ---
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

  for (const section of sections) {
    if (y > PAGE_BOTTOM - 15) {
      doc.addPage();
      y = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...NAVY_700);
    doc.text(section.title, MARGIN_X, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...BODY_GRAY);
    for (const line of section.lines) {
      const wrapped = doc.splitTextToSize(line, PAGE_RIGHT - MARGIN_X);
      doc.text(wrapped, MARGIN_X, y);
      y += wrapped.length * 5 + 2;
    }
    y += 4;
  }

  // --- Signatures ---
  if (y > PAGE_BOTTOM - 45) {
    doc.addPage();
    y = 20;
  }
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...BODY_GRAY);
  doc.text(`${company.city}, den ${new Date().toLocaleDateString("de-DE")}`, MARGIN_X, y);
  y += 22;
  doc.setDrawColor(...NAVY_900);
  doc.setLineWidth(0.4);
  doc.line(MARGIN_X, y, MARGIN_X + 70, y);
  doc.line(PAGE_RIGHT - 70, y, PAGE_RIGHT, y);
  y += 5;
  doc.setFontSize(9);
  doc.setTextColor(...NAVY_900);
  doc.text("Arbeitgeber", MARGIN_X, y);
  doc.text("Arbeitnehmer", PAGE_RIGHT - 70, y);

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    drawFooter(doc, company, page, pageCount);
  }

  return new Uint8Array(doc.output("arraybuffer"));
}
