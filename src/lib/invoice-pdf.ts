import { jsPDF } from "jspdf";
import type { CompanyInfo } from "@/lib/server/db-types";

export type InvoiceLineItem = { description: string; qty: number; price: number };

export type InvoiceForPdf = {
  number: string;
  customer: string;
  customerNumber: string;
  sachbearbeiter: string;
  date: string;
  items: InvoiceLineItem[];
};

// Same brand palette as the website / Arbeitsvertrag PDF (src/lib/server/contract-pdf.ts).
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

function formatEuro(value: number) {
  return `${value.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

/** Fetches the company logo (if any) as a data URL — runs client-side, so it uses fetch/FileReader instead of Node's Buffer (see server/contract-pdf.ts for the server-side equivalent). */
async function fetchLogoDataUrl(): Promise<{ dataUrl: string; mimeType: string } | null> {
  try {
    const res = await fetch("/api/company/logo", { cache: "no-store" });
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    return { dataUrl, mimeType: blob.type };
  } catch {
    return null;
  }
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

function drawSummaryCard(doc: jsPDF, facts: Array<{ label: string; value: string }>, y: number): number {
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

  return y + height + 10;
}

/**
 * Generates and downloads a Rechnung PDF, styled to match the Arbeitsvertrag
 * PDF (server/contract-pdf.ts): branded letterhead, two-tone sidebar/rule,
 * and a summary card with the key facts (Rechnungsnummer, Datum,
 * Sachbearbeiter, Kundennummer). Runs client-side (jsPDF + doc.save()), so
 * the logo — if one is set under Verwaltung → Unternehmensdaten — is fetched
 * over the network rather than read from disk like the server-side contract.
 */
export async function downloadInvoicePdf(invoice: InvoiceForPdf, company: CompanyInfo) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const logo = await fetchLogoDataUrl();
  let y = 20;

  doc.setFillColor(...MIST_TINT);
  doc.rect(0, 0, 210, 96, "F");

  // --- Letterhead ---
  let headerBottom = y + 16;
  const format = logo ? logoFormat(logo.mimeType) : null;
  if (logo && format) {
    try {
      const props = doc.getImageProperties(logo.dataUrl);
      const { width, height } = fitInBox(props.width, props.height, 55, 20);
      doc.addImage(logo.dataUrl, format, MARGIN_X, y - 4, width, height, undefined, "FAST");
      headerBottom = Math.max(headerBottom, y - 4 + height + 4);
    } catch {
      // A malformed/unsupported logo image should never block the PDF export.
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
  y += 12;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...NAVY_900);
  doc.text("Rechnung", MARGIN_X, y);
  y += 2.5;
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(1);
  doc.line(MARGIN_X, y, MARGIN_X + 24, y);

  // --- Summary card: Rechnungsnummer, Datum, Sachbearbeiter, Kundennummer ---
  y += 7;
  y = drawSummaryCard(
    doc,
    [
      { label: "RECHNUNGSNUMMER", value: invoice.number },
      { label: "DATUM", value: formatDate(invoice.date) },
      { label: "SACHBEARBEITER", value: invoice.sachbearbeiter || "—" },
      { label: "KUNDENNUMMER", value: invoice.customerNumber || "—" },
    ],
    y,
  );

  // --- Recipient ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...ACCENT);
  doc.text("RECHNUNGSEMPFÄNGER", MARGIN_X, y);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.setTextColor(...NAVY_900);
  doc.text(invoice.customer, MARGIN_X, y);
  y += 10;

  // --- Line items table ---
  function drawTableHeader() {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...NAVY_700);
    doc.text("POSITION", MARGIN_X, y);
    doc.text("MENGE", 130, y, { align: "right" });
    doc.text("EINZELPREIS", 160, y, { align: "right" });
    doc.text("SUMME", PAGE_RIGHT, y, { align: "right" });
    y += 2.5;
    doc.setDrawColor(...NAVY_900);
    doc.setLineWidth(0.6);
    doc.line(MARGIN_X, y, PAGE_RIGHT, y);
    y += 6;
  }

  drawTableHeader();

  let net = 0;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...BODY_GRAY);
  for (const item of invoice.items) {
    const lineTotal = item.qty * item.price;
    net += lineTotal;
    const lines = doc.splitTextToSize(item.description || "–", 100);
    const rowHeight = Math.max(6, lines.length * 5);

    if (y + rowHeight > PAGE_BOTTOM - 10) {
      doc.addPage();
      y = 20;
      drawTableHeader();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...BODY_GRAY);
    }

    doc.text(lines, MARGIN_X, y);
    doc.text(String(item.qty), 130, y, { align: "right" });
    doc.text(formatEuro(item.price), 160, y, { align: "right" });
    doc.text(formatEuro(lineTotal), PAGE_RIGHT, y, { align: "right" });
    y += rowHeight;
  }

  const vat = net * 0.19;
  const gross = net + vat;

  if (y > PAGE_BOTTOM - 40) {
    doc.addPage();
    y = 20;
  }

  y += 4;
  doc.setDrawColor(...RULE_GRAY);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_X, y, PAGE_RIGHT, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...BODY_GRAY);
  doc.text("Nettobetrag", 160, y, { align: "right" });
  doc.text(formatEuro(net), PAGE_RIGHT, y, { align: "right" });
  y += 6;
  doc.text("MwSt. (19 %)", 160, y, { align: "right" });
  doc.text(formatEuro(vat), PAGE_RIGHT, y, { align: "right" });
  y += 8;
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.5);
  doc.line(140, y - 5, PAGE_RIGHT, y - 5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...NAVY_900);
  doc.text("Gesamtbetrag", 160, y, { align: "right" });
  doc.text(formatEuro(gross), PAGE_RIGHT, y, { align: "right" });

  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BODY_GRAY);
  doc.text(`Vielen Dank für die Zusammenarbeit mit ${company.name}.`, MARGIN_X, y);

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    drawSidebar(doc);
    drawFooter(doc, company, page, pageCount);
  }

  doc.save(`${invoice.number}.pdf`);
}
