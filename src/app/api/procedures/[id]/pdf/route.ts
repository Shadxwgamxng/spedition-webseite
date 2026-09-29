import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/server/session";
import { getCollectionItem, getCompany, getCompanyLogo } from "@/lib/server/store";
import { generateProcedurePdf } from "@/lib/server/procedure-pdf";
import type { ProcedureRecord } from "@/lib/server/db-types";

function contentDisposition(fileName: string): string {
  const ascii = fileName.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "'");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

/** PDF-Export einer Verfahrensanweisung - jeder angemeldete Mitarbeiter darf herunterladen (gleicher Lesezugriff wie GET /api/procedures). */
export async function GET(_request: Request, ctx: RouteContext<"/api/procedures/[id]/pdf">) {
  const cookieStore = await cookies();
  const user = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!user) return Response.json({ ok: false, error: "Nicht angemeldet." }, { status: 401 });

  const { id } = await ctx.params;
  const procedure = await getCollectionItem<ProcedureRecord>("procedures", id);
  if (!procedure) return Response.json({ ok: false, error: "Verfahrensanweisung nicht gefunden." }, { status: 404 });

  const [company, logo] = await Promise.all([getCompany(), getCompanyLogo()]);
  const bytes = generateProcedurePdf({
    company,
    logo,
    title: procedure.title,
    body: procedure.body,
    issuedBy: procedure.issuedBy,
    issuedByRole: procedure.issuedByRole,
  });
  const fileName = `Verfahrensanweisung_${procedure.title.replace(/\s+/g, "_")}.pdf`;

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": contentDisposition(fileName),
      "Content-Length": String(bytes.length),
    },
  });
}
