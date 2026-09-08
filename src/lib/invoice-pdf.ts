import { jsPDF } from "jspdf";
import type { CompanyInfo } from "@/lib/server/db-types";

export type InvoiceLineItem = { description: string; qty: number; price: number };

export type InvoiceForPdf = {
  number: string;
  customer: string;
  date: string;
  items: InvoiceLineItem[];
};

export function downloadInvoicePdf(invoice: InvoiceForPdf, company: CompanyInfo) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const marginX = 20;
  let y = 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(company.name, marginX, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y += 6;
  doc.text(`${company.street}, ${company.zip} ${company.city}`, marginX, y);
  y += 5;
  doc.text(`${company.email} · ${company.phone}`, marginX, y);

  y += 15;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`Rechnung ${invoice.number}`, marginX, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y += 7;
  doc.text(`Kunde: ${invoice.customer}`, marginX, y);
  y += 5;
  doc.text(
    `Datum: ${new Date(invoice.date).toLocaleDateString("de-DE", { year: "numeric", month: "long", day: "numeric" })}`,
    marginX,
    y,
  );

  y += 12;
  doc.setFont("helvetica", "bold");
  doc.text("Position", marginX, y);
  doc.text("Menge", 130, y, { align: "right" });
  doc.text("Einzelpreis", 160, y, { align: "right" });
  doc.text("Summe", 190, y, { align: "right" });
  doc.setFont("helvetica", "normal");
  y += 2;
  doc.line(marginX, y, 190, y);
  y += 6;

  let net = 0;
  for (const item of invoice.items) {
    const lineTotal = item.qty * item.price;
    net += lineTotal;
    const lines = doc.splitTextToSize(item.description || "–", 100);
    doc.text(lines, marginX, y);
    doc.text(String(item.qty), 130, y, { align: "right" });
    doc.text(formatEuro(item.price), 160, y, { align: "right" });
    doc.text(formatEuro(lineTotal), 190, y, { align: "right" });
    y += Math.max(6, lines.length * 5);
  }

  const vat = net * 0.19;
  const gross = net + vat;

  y += 4;
  doc.line(marginX, y, 190, y);
  y += 8;
  doc.text("Nettobetrag", 160, y, { align: "right" });
  doc.text(formatEuro(net), 190, y, { align: "right" });
  y += 6;
  doc.text("MwSt. (19 %)", 160, y, { align: "right" });
  doc.text(formatEuro(vat), 190, y, { align: "right" });
  y += 7;
  doc.setFont("helvetica", "bold");
  doc.text("Gesamtbetrag", 160, y, { align: "right" });
  doc.text(formatEuro(gross), 190, y, { align: "right" });

  y += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Vielen Dank für die Zusammenarbeit mit Baltic Freight GmbH.", marginX, y);

  doc.save(`${invoice.number}.pdf`);
}

function formatEuro(value: number) {
  return `${value.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}
