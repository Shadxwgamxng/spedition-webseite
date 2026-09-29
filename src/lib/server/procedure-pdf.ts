import { jsPDF } from "jspdf";
import type { CompanyInfo } from "@/lib/server/db-types";
import { applySignatureFont, registerSignatureFont } from "@/lib/server/signature-font";

// Gleiche Briefkopf-/Sidebar-/Footer-Optik wie hr-letter-pdf.ts/contract-pdf.ts
// - bewusst dupliziert statt geteilt, s. Kommentar dort (jede der drei
// PDF-Arten hat ein eigenes Layout darunter, nur die Chrome drumherum ist
// identisch).
const NAVY_900: [number, number, number] = [10, 28, 66];
const ACCENT: [number, number, number] = [0, 96, 160];
const BODY_GRAY: [number, number, number] = [51, 51, 51];
const RULE_GRAY: [number, number, number] = [210, 215, 222];

const MARGIN_X = 20;
const PAGE_RIGHT = 190;
const PAGE_HEIGHT = 297;
const PAGE_BOTTOM = 270; // Platz für den Footer lassen
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

// ---------------------------------------------------------------------------
// Rich-Text-HTML (aus rich-text-editor.tsx, bereits serverseitig über
// sanitizeRichText auf ein enges Tag-Allowlist reduziert, s. store.ts) in
// stilisierte Textabschnitte für jsPDF zerlegen. Bewusst ein eigener,
// simpler Tokenizer statt eines echten HTML-Parsers (z. B. jsdom) - Node
// hat kein DOMParser eingebaut und für das erlaubte Tag-Set (b/strong/i/
// em/u/ul/ol/li/br/p/div/span) reicht ein schlanker Ansatz völlig.
// ---------------------------------------------------------------------------

type Run = { text: string; bold: boolean; italic: boolean; underline: boolean };
type Block = { runs: Run[]; prefix?: string };

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'");
}

function parseRichText(html: string): Block[] {
  const blocks: Block[] = [];
  let currentRuns: Run[] = [];
  let currentPrefix: string | undefined;
  let bold = 0;
  let italic = 0;
  let underline = 0;
  const listStack: Array<{ ordered: boolean; index: number }> = [];

  function flush() {
    if (currentRuns.some((r) => r.text.trim().length > 0)) {
      blocks.push({ runs: currentRuns, prefix: currentPrefix });
    }
    currentRuns = [];
    currentPrefix = undefined;
  }

  const tokens = html.match(/<[^>]+>|[^<]+/g) ?? [];
  for (const token of tokens) {
    if (token.startsWith("<")) {
      const closing = token.startsWith("</");
      const tag = token.replace(/^<\/?/, "").replace(/[\s/>][\s\S]*$/, "").toLowerCase();
      if (tag === "b" || tag === "strong") bold += closing ? -1 : 1;
      else if (tag === "i" || tag === "em") italic += closing ? -1 : 1;
      else if (tag === "u") underline += closing ? -1 : 1;
      else if (tag === "br") flush();
      else if (tag === "p" || tag === "div") {
        if (closing) flush();
      } else if (tag === "ul" || tag === "ol") {
        if (!closing) listStack.push({ ordered: tag === "ol", index: 0 });
        else listStack.pop();
      } else if (tag === "li") {
        if (!closing) {
          flush();
          const top = listStack[listStack.length - 1];
          if (top) {
            top.index += 1;
            currentPrefix = top.ordered ? `${top.index}.` : "•";
          }
        } else {
          flush();
        }
      }
      continue;
    }
    const text = decodeEntities(token).replace(/\s+/g, " ");
    if (!text.trim()) continue;
    currentRuns.push({ text, bold: bold > 0, italic: italic > 0, underline: underline > 0 });
  }
  flush();
  return blocks;
}

function fontStyleFor(bold: boolean, italic: boolean): string {
  if (bold && italic) return "bolditalic";
  if (bold) return "bold";
  if (italic) return "italic";
  return "normal";
}

/** Rendert die Blöcke ab startY, bricht die Seite bei Bedarf um, gibt die neue y-Position zurück. */
function renderBlocks(doc: jsPDF, blocks: Block[], startY: number, company: CompanyInfo): number {
  let y = startY;
  const lineHeight = 5.2;
  doc.setFontSize(10);

  function newPage() {
    doc.addPage();
    y = 24;
  }

  for (const block of blocks) {
    if (y + lineHeight > PAGE_BOTTOM) newPage();
    const indent = block.prefix ? 6 : 0;
    const lineStartX = MARGIN_X + indent;
    let x = lineStartX;
    if (block.prefix) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...BODY_GRAY);
      doc.text(block.prefix, MARGIN_X, y);
    }

    const words: Run[] = [];
    for (const run of block.runs) {
      for (const w of run.text.split(" ")) {
        if (w) words.push({ text: w, bold: run.bold, italic: run.italic, underline: run.underline });
      }
    }

    for (const word of words) {
      doc.setFont("helvetica", fontStyleFor(word.bold, word.italic));
      const wordWidth = doc.getTextWidth(word.text);
      const spaceWidth = doc.getTextWidth(" ");
      if (x + wordWidth > PAGE_RIGHT && x > lineStartX) {
        y += lineHeight;
        if (y + lineHeight > PAGE_BOTTOM) newPage();
        x = lineStartX;
      }
      doc.setTextColor(...BODY_GRAY);
      doc.text(word.text, x, y);
      if (word.underline) {
        doc.setDrawColor(...BODY_GRAY);
        doc.setLineWidth(0.25);
        doc.line(x, y + 0.8, x + wordWidth, y + 0.8);
      }
      x += wordWidth + spaceWidth;
    }
    y += lineHeight + 3.5;
  }

  void company; // Platzhalter, falls künftig pro Block auf company zurückgegriffen werden soll
  return y;
}

/**
 * Generiert ein mehrseitiges PDF für eine Verfahrensanweisung: Briefkopf,
 * Titel, formatierter Inhalt (aus dem Rich-Text-Editor) und eine
 * Unterschrift (Handschrift-Font, s. signature-font.ts) der Person, die die
 * Anweisung zuletzt gespeichert hat.
 */
export function generateProcedurePdf(input: {
  company: CompanyInfo;
  logo?: { bytes: Uint8Array; mimeType: string } | null;
  title: string;
  body: string;
  issuedBy?: string;
  /** Positions-Bezeichnung der unterzeichnenden Person (z. B. "Prokurist") - steuert das "ppa."-Kürzel vor der Unterschrift. */
  issuedByRole?: string;
}): Uint8Array {
  const { company, logo, title, body, issuedBy, issuedByRole } = input;
  const isProkurist = issuedByRole?.toLowerCase().includes("prokurist") ?? false;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  registerSignatureFont(doc);
  let y = 20;

  // --- Letterhead ---
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
      // Ein defektes/nicht unterstütztes Logo darf die PDF-Erstellung nie blockieren.
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

  // --- Title ---
  y += 14;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...NAVY_900);
  doc.text("Verfahrensanweisung", MARGIN_X, y);
  y += 2.5;
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(1);
  doc.line(MARGIN_X, y, MARGIN_X + 24, y);
  y += 9;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...BODY_GRAY);
  const wrappedTitle = doc.splitTextToSize(title, PAGE_RIGHT - MARGIN_X);
  doc.text(wrappedTitle, MARGIN_X, y);
  y += wrappedTitle.length * 6 + 8;

  // --- Body ---
  const blocks = parseRichText(body);
  y = renderBlocks(doc, blocks, y, company);

  // --- Signature ---
  y += 12;
  if (y + 20 > PAGE_BOTTOM) {
    doc.addPage();
    y = 30;
  }
  applySignatureFont(doc, 18);
  doc.setTextColor(...NAVY_900);
  doc.text(issuedBy ? (isProkurist ? `ppa. ${issuedBy}` : issuedBy) : company.name, MARGIN_X + 2, y - 3, { maxWidth: 80 });
  doc.setDrawColor(...NAVY_900);
  doc.setLineWidth(0.4);
  doc.line(MARGIN_X, y, MARGIN_X + 80, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...NAVY_900);
  doc.text(
    issuedBy ? `${issuedBy} - ${company.name} (${isProkurist ? "Prokura" : "Geschäftsführung"})` : `${company.name} (Geschäftsführung)`,
    MARGIN_X,
    y,
  );

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    drawSidebar(doc);
    drawFooter(doc, company, page, pageCount);
  }

  return new Uint8Array(doc.output("arraybuffer"));
}
