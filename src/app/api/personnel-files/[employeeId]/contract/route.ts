import { generateAndDistributeContract } from "@/lib/server/contract-generation";

/**
 * Manually (re-)generates the Arbeitsvertrag for an employee, regardless of
 * whether one was already generated — e.g. after a promotion, so a fresh
 * contract reflecting the updated role can be created on demand. Unlike the
 * automatic trigger in PATCH /api/personnel-files/[employeeId], this is not
 * gated by `isPersonnelFileComplete`/`contractGeneratedAt`.
 */
export async function POST(_request: Request, ctx: RouteContext<"/api/personnel-files/[employeeId]/contract">) {
  const { employeeId } = await ctx.params;
  const result = await generateAndDistributeContract(employeeId);
  if (!result.generated) {
    return Response.json({ ok: false, error: result.error }, { status: 404 });
  }
  return Response.json({ ok: true, personnelFile: result.personnelFile, contract: result });
}
