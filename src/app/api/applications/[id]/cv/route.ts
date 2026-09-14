import { promises as fs } from "node:fs";
import { getApplicationCv } from "@/lib/server/store";

function contentDisposition(fileName: string): string {
  const ascii = fileName.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "'");
  return `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

export async function GET(_request: Request, ctx: RouteContext<"/api/applications/[id]/cv">) {
  const { id } = await ctx.params;
  const cv = await getApplicationCv(id);
  if (!cv) return Response.json({ ok: false, error: "Keine Datei hinterlegt." }, { status: 404 });

  let bytes: Buffer;
  try {
    bytes = await fs.readFile(cv.filePath);
  } catch {
    return Response.json({ ok: false, error: "Datei nicht gefunden." }, { status: 404 });
  }

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": cv.mimeType,
      "Content-Disposition": contentDisposition(cv.fileName),
      "Content-Length": String(cv.size),
    },
  });
}
