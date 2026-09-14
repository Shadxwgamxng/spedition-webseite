import { jsPDF } from "jspdf";
import type { CompanyInfo, PersonnelFileRecord } from "@/lib/server/db-types";

// Same brand palette as the website (src/app/globals.css) — navy for text/
// structure, the signal-blue accent (sampled from the logo) for highlights.
const NAVY_900: [number, number, number] = [10, 28, 66];
const NAVY_700: [number, number, number] = [22, 59, 122];
const ACCENT: [number, number, number] = [0, 96, 160];
const BODY_GRAY: [number, number, number] = [51, 51, 51];
const RULE_GRAY: [number, number, number] = [210, 215, 222];
const MIST_TINT: [number, number, number] = [245, 247, 250];

const MARGIN_X = 20;
const PAGE_RIGHT = 190;
const PAGE_BOTTOM = 272;
const PAGE_HEIGHT = 297;
const SIDEBAR_WIDTH = 3;
const COVER_TINT_HEIGHT = 100;

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

/** Brand-colored spine down the left edge of every page, echoing the letterhead's two-tone rule. */
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

/** A numbered navy badge followed by the section title, jsPDF's answer to a styled §-heading. */
function drawSectionHeading(doc: jsPDF, num: number, title: string, y: number): number {
  const badgeSize = 6.4;
  doc.setFillColor(...NAVY_900);
  doc.roundedRect(MARGIN_X, y - 4.9, badgeSize, badgeSize, 1.3, 1.3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(String(num), MARGIN_X + badgeSize / 2, y - 0.4, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...NAVY_700);
  doc.text(title, MARGIN_X + badgeSize + 3.5, y);
  return y + 7;
}

/** Compact "auf einen Blick" summary card with the key facts of the employment. */
function drawSummaryCard(
  doc: jsPDF,
  facts: Array<{ label: string; value: string }>,
  y: number,
): number {
  const height = 24;
  doc.setFillColor(...MIST_TINT);
  doc.setDrawColor(...RULE_GRAY);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN_X, y, PAGE_RIGHT - MARGIN_X, height, 2, 2, "FD");

  const colWidth = (PAGE_RIGHT - MARGIN_X) / facts.length;
  facts.forEach((fact, i) => {
    const cx = MARGIN_X + i * colWidth + 5;
    if (i > 0) {
      doc.setDrawColor(...RULE_GRAY);
      doc.setLineWidth(0.2);
      doc.line(MARGIN_X + i * colWidth, y + 4, MARGIN_X + i * colWidth, y + height - 4);
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.8);
    doc.setTextColor(...ACCENT);
    doc.text(fact.label, cx, y + 8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...NAVY_900);
    const wrapped = doc.splitTextToSize(fact.value, colWidth - 8);
    doc.text(wrapped.slice(0, 2), cx, y + 15.5);
  });

  return y + height + 9;
}

/**
 * Generates a comprehensive Arbeitsvertrag (employment contract) PDF from
 * company letterhead data and a completed Personalakte. This is a template
 * for a fictive Spedition, not a legally vetted document — compensation,
 * weekly working hours and vacation-day counts are deliberately left generic
 * (statutory minimums / "nach gesonderter Vereinbarung") since no such fields
 * exist in the Personalakte, and none should be invented per employee.
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

  // Soft cover tint behind the letterhead/title/summary card, drawn first so
  // everything else layers on top of it.
  doc.setFillColor(...MIST_TINT);
  doc.rect(0, 0, 210, COVER_TINT_HEIGHT, "F");

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

  // --- Title + status pill ---
  y += 12;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...NAVY_900);
  doc.text("Arbeitsvertrag", MARGIN_X, y);

  const pillLabel = "UNBEFRISTETES ARBEITSVERHÄLTNIS";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  const pillTextWidth = doc.getTextWidth(pillLabel);
  const pillWidth = pillTextWidth + 7;
  const pillHeight = 6.4;
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.4);
  doc.roundedRect(PAGE_RIGHT - pillWidth, y - pillHeight + 1.5, pillWidth, pillHeight, pillHeight / 2, pillHeight / 2, "S");
  doc.setTextColor(...ACCENT);
  doc.text(pillLabel, PAGE_RIGHT - pillWidth / 2, y - 1, { align: "center" });

  y += 2.5;
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(1);
  doc.line(MARGIN_X, y, MARGIN_X + 24, y);

  // --- "Auf einen Blick" summary card ---
  y += 7;
  y = drawSummaryCard(
    doc,
    [
      { label: "POSITION", value: roleLabel },
      { label: "ABTEILUNG", value: department },
      { label: "BESCHÄFTIGUNG", value: file.employmentType || "—" },
      { label: "BEGINN", value: formatDate(file.hireDate) },
    ],
    y,
  );

  // --- § 1 Vertragsparteien ---
  y = drawSectionHeading(doc, 1, "Vertragsparteien", y);
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

  // --- §§ 2–14 ---
  const sections: Array<{ title: string; lines: string[] }> = [
    {
      title: "Tätigkeit und Einsatzort",
      lines: [
        `Der Arbeitnehmer wird als „${roleLabel}" in der Abteilung „${department}" beschäftigt.`,
        "Er/Sie verpflichtet sich, im Rahmen der betrieblichen Erfordernisse auch andere, zumutbare Tätigkeiten zu übernehmen, die seinen bzw. ihren Kenntnissen und Fähigkeiten entsprechen.",
        `Einsatzort ist ${company.city}, vorbehaltlich einer anderslautenden betrieblichen Anordnung.`,
      ],
    },
    {
      title: "Beginn, Dauer und Probezeit",
      lines: [
        `Das Arbeitsverhältnis beginnt am ${formatDate(file.hireDate)} und wird auf unbestimmte Zeit geschlossen.`,
        "Die ersten sechs Monate des Arbeitsverhältnisses gelten als Probezeit. Während der Probezeit kann das Arbeitsverhältnis von beiden Seiten mit einer Frist von zwei Wochen gekündigt werden.",
      ],
    },
    {
      title: "Arbeitszeit",
      lines: [
        `Die Arbeitszeit richtet sich nach der vereinbarten Beschäftigungsart („${file.employmentType || "—"}") sowie den betrieblichen Erfordernissen des Arbeitgebers.`,
        "Bei betrieblicher Notwendigkeit ist der Arbeitnehmer im Rahmen der gesetzlichen Vorschriften zur Ableistung von Mehrarbeit und Überstunden verpflichtet.",
      ],
    },
    {
      title: "Vergütung",
      lines: [
        "Die Vergütung erfolgt nach gesonderter Vereinbarung zwischen den Vertragsparteien und wird monatlich nachträglich auf das vom Arbeitnehmer benannte Konto ausgezahlt.",
        "Änderungen der Kontoverbindung sind dem Arbeitgeber unverzüglich mitzuteilen.",
      ],
    },
    {
      title: "Urlaub",
      lines: [
        "Der Arbeitnehmer hat Anspruch auf den gesetzlichen Mindesturlaub gemäß Bundesurlaubsgesetz pro Kalenderjahr.",
        "Zeitpunkt und Dauer des Urlaubs richten sich nach den betrieblichen Möglichkeiten unter angemessener Berücksichtigung der Wünsche des Arbeitnehmers.",
      ],
    },
    {
      title: "Arbeitsverhinderung und Krankmeldung",
      lines: [
        "Ist der Arbeitnehmer an der Erbringung seiner Arbeitsleistung verhindert, hat er den Arbeitgeber unverzüglich unter Angabe der voraussichtlichen Dauer zu informieren.",
        "Im Krankheitsfall ist spätestens am vierten Kalendertag eine ärztliche Bescheinigung über die Arbeitsunfähigkeit vorzulegen; Gleiches gilt für Folgebescheinigungen.",
      ],
    },
    {
      title: "Nebentätigkeiten",
      lines: [
        "Jede entgeltliche oder das Arbeitsverhältnis beeinträchtigende Nebentätigkeit ist dem Arbeitgeber vor ihrer Aufnahme in Textform anzuzeigen und bedarf dessen Zustimmung.",
        "Die Zustimmung wird erteilt, sofern die Nebentätigkeit die dienstlichen Aufgaben nicht beeinträchtigt und keine berechtigten Interessen des Arbeitgebers verletzt.",
      ],
    },
    {
      title: "Pflichten des Arbeitgebers",
      lines: [
        "Der Arbeitgeber verpflichtet sich, dem Arbeitnehmer die für die Tätigkeit erforderlichen Kenntnisse, Arbeitsmittel und Informationen zur Verfügung zu stellen und die vereinbarte Vergütung ordnungsgemäß zu leisten.",
      ],
    },
    {
      title: "Pflichten des Arbeitnehmers",
      lines: [
        "Der Arbeitnehmer verpflichtet sich, seine Aufgaben gewissenhaft zu erfüllen, betriebliche Anweisungen zu befolgen und die im Betrieb geltenden Richtlinien und Arbeitsanweisungen einzuhalten.",
      ],
    },
    {
      title: "Verschwiegenheitspflicht",
      lines: [
        "Der Arbeitnehmer verpflichtet sich, über alle betrieblichen und geschäftlichen Angelegenheiten vertraulicher Natur während und nach Beendigung des Arbeitsverhältnisses Stillschweigen zu bewahren und diese nicht an Dritte weiterzugeben.",
      ],
    },
    {
      title: "Haftung und Schadensersatz",
      lines: [
        "Für Schäden, die der Arbeitnehmer in Ausübung seiner Tätigkeit verursacht, haftet er nach den Grundsätzen der beschränkten Arbeitnehmerhaftung.",
        "Bei leichter Fahrlässigkeit entfällt die Haftung, bei mittlerer Fahrlässigkeit erfolgt eine anteilige Schadensteilung; bei grober Fahrlässigkeit oder Vorsatz haftet der Arbeitnehmer in vollem Umfang.",
      ],
    },
    {
      title: "Kündigung",
      lines: [
        "Für die Kündigung dieses Vertrags gelten die gesetzlichen Kündigungsfristen. Die Kündigung bedarf der Schriftform.",
        "Der Arbeitgeber kann den Arbeitnehmer bis zur Beendigung des Arbeitsverhältnisses unter Anrechnung noch bestehender Urlaubsansprüche von der Arbeitsleistung freistellen.",
      ],
    },
    {
      title: "Vertragsänderungen, Nebenabreden und Schlussbestimmungen",
      lines: [
        "Mündliche Nebenabreden bestehen nicht. Änderungen und Ergänzungen dieses Vertrags bedürfen der Textform; dies gilt auch für die Aufhebung dieser Klausel.",
        "Sollte eine Bestimmung dieses Vertrags unwirksam sein oder werden, bleibt der Vertrag im Übrigen wirksam; an die Stelle der unwirksamen Bestimmung tritt eine dem wirtschaftlichen Zweck möglichst nahekommende wirksame Regelung.",
        "Dieser Vertrag wird in zweifacher Ausfertigung erstellt — je eine für den Arbeitgeber und den Arbeitnehmer.",
      ],
    },
  ];

  sections.forEach((section, index) => {
    if (y > PAGE_BOTTOM - 20) {
      doc.addPage();
      y = 20;
    }
    y = drawSectionHeading(doc, index + 2, section.title, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...BODY_GRAY);
    for (const line of section.lines) {
      const wrapped = doc.splitTextToSize(line, PAGE_RIGHT - MARGIN_X);
      doc.text(wrapped, MARGIN_X, y);
      y += wrapped.length * 5 + 2;
    }
    y += 4;
  });

  // --- Signatures ---
  if (y > PAGE_BOTTOM - 45) {
    doc.addPage();
    y = 20;
  }
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...BODY_GRAY);
  doc.text(`${company.city}, den ${formatDate(new Date().toISOString())}`, MARGIN_X, y);
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
    drawSidebar(doc);
    drawFooter(doc, company, page, pageCount);
  }

  return new Uint8Array(doc.output("arraybuffer"));
}
