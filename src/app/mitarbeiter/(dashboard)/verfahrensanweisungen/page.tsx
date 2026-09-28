"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { canAccessModule } from "@/lib/roles";
import { usePolling } from "@/lib/use-polling";
import { EmployeePageHeader } from "@/components/employee/page-header";
import { ShieldIcon } from "@/components/ui/icons";

type ProcedureRecord = { id: string; title: string; body: string };

export default function VerfahrensanweisungenPage() {
  const { user } = useAuth();
  const { data } = usePolling<{ items: ProcedureRecord[] }>("/api/procedures", 15000);
  const [openId, setOpenId] = useState<string | null>(null);

  if (!user || !canAccessModule(user.roleKey, "verfahrensanweisungen")) {
    return <p className="text-sm text-navy-700/60">Kein Zugriff.</p>;
  }

  const procedures = data?.items ?? [];

  return (
    <div>
      <EmployeePageHeader
        title="Verfahrensanweisungen"
        description="Interne Arbeitsanweisungen zum Nachlesen. Erstellt und bearbeitet werden sie von der Geschäftsführung unter Verwaltung."
      />

      {procedures.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-navy-900/8 bg-white p-8 text-sm text-navy-700/60">
          Aktuell sind keine Verfahrensanweisungen hinterlegt.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {procedures.map((procedure) => {
            const open = openId === procedure.id;
            return (
              <div key={procedure.id} className="overflow-hidden rounded-2xl border border-navy-900/8 bg-white shadow-sm shadow-navy-950/5">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : procedure.id)}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-700">
                    <ShieldIcon className="h-4 w-4" />
                  </span>
                  <span className="flex-1 text-sm font-semibold text-navy-900">{procedure.title}</span>
                  <span className="text-xs font-semibold text-navy-700/50">{open ? "Zuklappen" : "Öffnen"}</span>
                </button>
                {open ? (
                  <div
                    className="border-t border-navy-900/8 px-5 py-4 text-sm leading-relaxed text-navy-800 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
                    dangerouslySetInnerHTML={{ __html: procedure.body }}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
