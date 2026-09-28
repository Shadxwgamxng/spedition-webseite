import { jsPDF } from "jspdf";
import type { CompanyInfo, PersonnelFileRecord } from "@/lib/server/db-types";
import { applySignatureFont, registerSignatureFont } from "@/lib/server/signature-font";

// Same brand palette/letterhead treatment as contract-pdf.ts (Arbeitsvertrag)
// — kept as a small, deliberate duplication rather than sharing helpers
// across the two files, since a formal letter (this) and a multi-section
// contract (that) only overlap in the letterhead/sidebar/footer chrome.
const NAVY_900: [number, number, number] = [10, 28, 66];
const ACCENT: [number, number, number] = [0, 96, 160];
const BODY_GRAY: [number, number, number] = [51, 51, 51];
const RULE_GRAY: [number, number, number] = [210, 215, 222];
const MIST_TINT: [number, number, number] = [245, 247, 250];

const MARGIN_X = 20;
const PAGE_RIGHT = 190;
const PAGE_HEIGHT = 297;
const SIDEBAR_WIDTH = 3;

function logoFormat(mimeType: string): "PNG" | "JPEG" | "WEBP" | null {
  const match = /^image\/(png|jpe?g|webp)$/i.exec(mimeType);
  if (!match) return null;
  const ext = match[1].toLowerCase();
  if (ext === "png") return "PNG";
  if (ext === "webp") return "WEBP";
  return "JPEG";
}

function fitInBox(naturalWidth: number, naturalHeight: number, maxWidth: number, maxHeight: number) {
  const scale = Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight, 1);
  return { width: naturalWidth * scale, height: naturalHeight * scale };
}

function formatDate(value: string): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function drawSidebar(doc: jsPDF) {
  doc.setFillColor(...NAVY_900);
  doc.rect(0, 0, SIDEBAR_WIDTH, PAGE_HEIGHT, "F");
  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, SIDEBAR_WIDTH, 42, "F");
}

function drawFooter(doc: jsPDF, company: CompanyInfo, page: number, pageCount: number) {
  doc.setFillColor(...ACCENT);
  doc.rect(MARGIN_X, 279.4, 7, 1, "F");
  doc.setDrawColor(...RULE_GRAY);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_X, 281, PAGE_RIGHT, 281);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 128, 140);
  doc.text(company.name, MARGIN_X, 286);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...ACCENT);
  doc.text(`Seite ${page} von ${pageCount}`, PAGE_RIGHT, 286, { align: "right" });
}

export type HrLetterKind = "abmahnung" | "kuendigung";

const KIND_TITLE: Record<HrLetterKind, string> = {
  abmahnung: "Abmahnung",
  kuendigung: "Kündigung des Arbeitsverhältnisses",
};

/**
 * Generates a one-page formal HR letter (Abmahnung or Kündigung) from
 * company letterhead data, the employee's Personalakte address, and the
 * Grund/Datum entered in the "Abmahnung erstellen"/"Kündigung erstellen"
 * dialog. Same disclaimer as the Arbeitsvertrag: a template for a fictive
 * Spedition, not a legally vetted document.
 */
export function generateHrLetterPdf(input: {
  kind: HrLetterKind;
  company: CompanyInfo;
  employeeName: string;
  file: PersonnelFileRecord;
  logo?: { bytes: Uint8Array; mimeType: string } | null;
  date: string;
  reason: string;
  effectiveDate?: string;
  terminationType?: "ordentlich" | "fristlos";
  /** Name der Person, die das Schreiben ausstellt (aus der Sitzung) - erscheint als Unterschrift; leer -> nur der Firmenname wird unterschrieben. */
  issuedBy?: string;
}): Uint8Array {
  const { kind, company, employeeName, file, logo, date, reason, effectiveDate, terminationType, issuedBy } = input;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  registerSignatureFont(doc);
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
      // A malformed/unsupported logo image should never block letter generation.
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

  y = headerBottom + 4;
  doc.setDrawColor(...NAVY_900);
  doc.setLineWidth(1.1);
  doc.line(MARGIN_X, y, PAGE_RIGHT - 30, y);
  doc.setDrawColor(...ACCENT);
  doc.line(PAGE_RIGHT - 30, y, PAGE_RIGHT, y);

  // --- Recipient block ---
  y += 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...BODY_GRAY);
  doc.text(employeeName, MARGIN_X, y);
  const employeeAddress = [file.street, [file.zip, file.city].filter(Boolean).join(" ")].filter(Boolean);
  for (const line of employeeAddress) {
    y += 5;
    doc.text(line, MARGIN_X, y);
  }

  // --- Place/date, right-aligned ---
  doc.text(`${company.city}, den ${formatDate(date)}`, PAGE_RIGHT, y, { align: "right" });

  // --- Title ---
  y += 16;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...NAVY_900);
  doc.text(KIND_TITLE[kind], MARGIN_X, y);
  y += 2.5;
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(1);
  doc.line(MARGIN_X, y, MARGIN_X + 24, y);

  // --- Subject line: nur die Details, die der große Titel (KIND_TITLE)
  // direkt darüber noch nicht sagt - sonst stünde "Abmahnung"/"Kündigung"
  // zweimal untereinander (einmal als Titel, einmal als "Betreff: ..."-
  // Wiederholung desselben Worts). Bei der Abmahnung gibt es nichts, was
  // der Titel nicht schon sagt, daher entfällt die Zeile dort komplett.
  y += 9;
  const subject =
    kind === "kuendigung"
      ? `${terminationType === "fristlos" ? "Außerordentlich, fristlos" : "Ordentlich"}${effectiveDate ? ` · wirksam zum ${formatDate(effectiveDate)}` : ""}`
      : null;
  if (subject) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...BODY_GRAY);
    const wrappedSubject = doc.splitTextToSize(subject, PAGE_RIGHT - MARGIN_X);
    doc.text(wrappedSubject, MARGIN_X, y);
    y += wrappedSubject.length * 5 + 8;
  } else {
    y += 6;
  }

  // --- Salutation ---
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...BODY_GRAY);
  doc.text(`Sehr geehrte(r) ${employeeName},`, MARGIN_X, y);
  y += 9;

  // --- Body ---
  const introLine =
    kind === "abmahnung"
      ? "hiermit erteilen wir Ihnen eine Abmahnung wegen folgenden Verhaltens:"
      : `hiermit kündigen wir das mit Ihnen bestehende Arbeitsverhältnis ${terminationType === "fristlos" ? "außerordentlich und fristlos" : `ordentlich zum ${formatDate(effectiveDate || date)}`}. Grund für diese Entscheidung:`;
  const introWrapped = doc.splitTextToSize(introLine, PAGE_RIGHT - MARGIN_X);
  doc.text(introWrapped, MARGIN_X, y);
  y += introWrapped.length * 5 + 6;

  // Reason, visually set off in a light box so it reads as the quoted/cited grounds.
  const reasonWrapped = doc.splitTextToSize(reason, PAGE_RIGHT - MARGIN_X - 8);
  const reasonBoxHeight = reasonWrapped.length * 5 + 8;
  doc.setFillColor(...MIST_TINT);
  doc.setDrawColor(...RULE_GRAY);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN_X, y, PAGE_RIGHT - MARGIN_X, reasonBoxHeight, 2, 2, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...NAVY_900);
  doc.text(reasonWrapped, MARGIN_X + 4, y + 6);
  y += reasonBoxHeight + 9;

  const closingLines =
    kind === "abmahnung"
      ? [
          "Wir fordern Sie auf, das oben genannte Verhalten künftig zu unterlassen. Bei einem erneuten oder vergleichbaren Verstoß müssen Sie mit weiteren arbeitsrechtlichen Konsequenzen bis hin zur Kündigung des Arbeitsverhältnisses rechnen.",
          "Diese Abmahnung wird zu Ihrer Personalakte genommen.",
        ]
      : [
          "Bitte übergeben Sie uns sämtliche in Ihrem Besitz befindlichen Firmengegenstände (Schlüssel, Fahrzeuge, Arbeitsmittel u. Ä.) spätestens zum Ende des Arbeitsverhältnisses.",
          "Für die künftige Zukunft wünschen wir Ihnen alles Gute.",
        ];
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...BODY_GRAY);
  for (const line of closingLines) {
    const wrapped = doc.splitTextToSize(line, PAGE_RIGHT - MARGIN_X);
    doc.text(wrapped, MARGIN_X, y);
    y += wrapped.length * 5 + 4;
  }

  y += 6;
  doc.text("Mit freundlichen Grüßen", MARGIN_X, y);

  // --- Signatures (beide Seiten unterschreiben automatisch) ---
  y += 22;
  applySignatureFont(doc, 20);
  doc.setTextColor(...NAVY_900);
  doc.text(issuedBy || company.name, MARGIN_X + 2, y - 3, { maxWidth: 66 });
  doc.text(employeeName, PAGE_RIGHT - 68, y - 3, { maxWidth: 66 });
  doc.setDrawColor(...NAVY_900);
  doc.setLineWidth(0.4);
  doc.line(MARGIN_X, y, MARGIN_X + 70, y);
  doc.line(PAGE_RIGHT - 70, y, PAGE_RIGHT, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...NAVY_900);
  doc.text(issuedBy ? `${issuedBy} - ${company.name} (Geschäftsführung)` : `${company.name} (Geschäftsführung)`, MARGIN_X, y);
  doc.text(`${employeeName} (Kenntnisnahme)`, PAGE_RIGHT - 70, y);

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    drawSidebar(doc);
    drawFooter(doc, company, page, pageCount);
  }

  return new Uint8Array(doc.output("arraybuffer"));
}
