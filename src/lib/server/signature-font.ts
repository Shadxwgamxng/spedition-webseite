import fs from "node:fs";
import path from "node:path";
import type { jsPDF } from "jspdf";

// "Alex Brush" (SIL Open Font License, see fonts/AlexBrush-OFL.txt) - a
// script font designed to read as a real pen signature, used to auto-render
// a name as a "signature" on generated HR documents (Arbeitsvertrag,
// Abmahnung, Kündigung) instead of leaving the signature line blank.
const FONT_PATH = path.join(process.cwd(), "src/lib/server/fonts/AlexBrush-Regular.ttf");
const FONT_NAME = "AlexBrush";

let cachedBase64: string | null = null;

function loadFontBase64(): string {
  if (cachedBase64 === null) {
    cachedBase64 = fs.readFileSync(FONT_PATH).toString("base64");
  }
  return cachedBase64;
}

/** Registers the signature font with a jsPDF document - once per document instance, before the first applySignatureFont call. */
export function registerSignatureFont(doc: jsPDF): void {
  doc.addFileToVFS(`${FONT_NAME}.ttf`, loadFontBase64());
  doc.addFont(`${FONT_NAME}.ttf`, FONT_NAME, "normal");
}

/** Switches the document to the signature font at the given size - call registerSignatureFont(doc) once first. */
export function applySignatureFont(doc: jsPDF, sizePt = 24): void {
  doc.setFont(FONT_NAME, "normal");
  doc.setFontSize(sizePt);
}
