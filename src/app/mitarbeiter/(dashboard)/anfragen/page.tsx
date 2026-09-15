"use client";

import { useMemo } from "react";
import { EmployeePageHeader, StatCard } from "@/components/employee/page-header";
import { Badge } from "@/components/ui/primitives";
import { usePolling } from "@/lib/use-polling";
import type { ContactInquiryRecord } from "@/lib/server/db-types";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AnfragenPage() {
  const { data } = usePolling<{ inquiries: ContactInquiryRecord[] }>("/api/contact", 6000);
  const inquiries = useMemo(() => data?.inquiries ?? [], [data]);
  const openCount = inquiries.filter((i) => i.replies.length === 0).length;

  return (
    <div>
      <EmployeePageHeader
        title="Anfragen"
        description="Kontaktanfragen von der Website sichten, im Detail öffnen und per Discord-DM beantworten."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Anfragen gesamt" value={String(inquiries.length)} />
        <StatCard label="Noch unbeantwortet" value={String(openCount)} tone={openCount ? "warn" : "good"} />
        <StatCard label="Beantwortet" value={String(inquiries.length - openCount)} tone="good" />
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-navy-900/8 bg-white shadow-sm shadow-navy-950/5">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="border-b border-navy-900/8 bg-mist-100 text-xs uppercase tracking-wide text-navy-700/60">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Unternehmen</th>
              <th className="px-4 py-3 font-medium">Discord-ID</th>
              <th className="px-4 py-3 font-medium">Eingegangen</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">&nbsp;</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-900/6">
            {inquiries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-navy-700/60">
                  Noch keine Anfragen eingegangen.
                </td>
              </tr>
            ) : (
              inquiries.map((inquiry) => (
                <tr key={inquiry.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-navy-900">{inquiry.name}</div>
                    <div className="text-xs text-navy-700/60">{inquiry.email}</div>
                  </td>
                  <td className="px-4 py-3 text-navy-800">{inquiry.company || "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-navy-700/70">{inquiry.discordId}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-navy-700/70">{formatDateTime(inquiry.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={inquiry.replies.length > 0 ? "green" : "amber"}>
                      {inquiry.replies.length > 0 ? `Beantwortet (${inquiry.replies.length})` : "Unbeantwortet"}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <a
                      href={`/mitarbeiter/anfragen/${inquiry.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-amber-600 hover:text-amber-700"
                    >
                      Anzeigen
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
