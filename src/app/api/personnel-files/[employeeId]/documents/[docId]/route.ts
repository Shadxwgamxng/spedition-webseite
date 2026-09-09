import { promises as fs } from "node:fs";
import { deletePersonnelDocument, getPersonnelDocument } from "@/lib/server/store";

function contentDisposition(fileName: string): string {
  const ascii = fileName.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "'");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/personnel-files/[employeeId]/documents/[docId]">,
) {
  const { employeeId, docId } = await ctx.params;
  const doc = await getPersonnelDocument(employeeId, docId);
  if (!doc) return Response.json({ ok: false, error: "Datei nicht gefunden." }, { status: 404 });

  let bytes: Buffer;
  try {
    bytes = await fs.readFile(doc.filePath);
  } catch {
    return Response.json({ ok: false, error: "Datei nicht gefunden." }, { status: 404 });
  }

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": doc.record.mimeType,
      "Content-Disposition": contentDisposition(doc.record.fileName),
      "Content-Length": String(doc.record.size),
    },
  });
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/personnel-files/[employeeId]/documents/[docId]">,
) {
  const { employeeId, docId } = await ctx.params;
  const ok = await deletePersonnelDocument(employeeId, docId);
  if (!ok) return Response.json({ ok: false, error: "Datei nicht gefunden." }, { status: 404 });
  return Response.json({ ok: true });
}
