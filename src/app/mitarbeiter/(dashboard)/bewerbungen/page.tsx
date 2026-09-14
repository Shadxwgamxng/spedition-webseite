"use client";

import { useMemo, useState } from "react";
import { EmployeePageHeader, StatCard } from "@/components/employee/page-header";
import { usePolling } from "@/lib/use-polling";
import type { ApplicationStatus, JobApplicationRecord } from "@/lib/server/db-types";

const STATUS_OPTIONS: ApplicationStatus[] = ["Neu", "In Prüfung", "Eingeladen", "Angenommen", "Abgelehnt"];

const statusClass: Record<ApplicationStatus, string> = {
  Neu: "bg-navy-900/8 text-navy-800",
  "In Prüfung": "bg-amber-400/15 text-amber-700",
  Eingeladen: "bg-[#5865F2]/10 text-[#5865F2]",
  Angenommen: "bg-emerald-500/10 text-emerald-700",
  Abgelehnt: "bg-red-500/10 text-red-700",
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function BewerbungenPage() {
  const { data, refetch } = usePolling<{ applications: JobApplicationRecord[] }>("/api/applications", 6000);
  const applications = useMemo(() => data?.applications ?? [], [data]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const neuCount = applications.filter((a) => a.status === "Neu").length;
  const eingeladenCount = applications.filter((a) => a.status === "Eingeladen").length;
  const angenommenCount = applications.filter((a) => a.status === "Angenommen").length;

  async function changeStatus(id: string, status: ApplicationStatus) {
    setUpdatingId(id);
    setNotice(null);
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.ok) {
        setNotice(
          json.discordDm?.ok
            ? "Status aktualisiert — Bewerber:in wurde per Discord-DM informiert."
            : `Status aktualisiert, aber die Discord-DM konnte nicht verschickt werden: ${json.discordDm?.error ?? "unbekannter Fehler"}`,
        );
      }
      await refetch();
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      <EmployeePageHeader
        title="Bewerbungen"
        description="Eingehende Bewerbungen sichten, im Detail öffnen und den Status je Bewerbung ändern."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Bewerbungen gesamt" value={String(applications.length)} />
        <StatCard label="Neu" value={String(neuCount)} tone={neuCount ? "warn" : "default"} />
        <StatCard label="Eingeladen" value={String(eingeladenCount)} />
        <StatCard label="Angenommen" value={String(angenommenCount)} tone="good" />
      </div>

      {notice ? (
        <p className="mt-4 rounded-xl border border-navy-900/8 bg-mist-50 px-4 py-2.5 text-sm text-navy-700">{notice}</p>
      ) : null}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-navy-900/8 bg-white shadow-sm shadow-navy-950/5">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="border-b border-navy-900/8 bg-mist-100 text-xs uppercase tracking-wide text-navy-700/60">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Position</th>
              <th className="px-4 py-3 font-medium">Discord-ID</th>
              <th className="px-4 py-3 font-medium">Eingegangen</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">&nbsp;</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-900/6">
            {applications.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-navy-700/60">
                  Noch keine Bewerbungen eingegangen.
                </td>
              </tr>
            ) : (
              applications.map((app) => (
                <tr key={app.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-navy-900">
                      {app.firstName} {app.lastName}
                    </div>
                    <div className="text-xs text-navy-700/60">{app.email}</div>
                  </td>
                  <td className="px-4 py-3 text-navy-800">{app.position || "Initiativbewerbung"}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-navy-700/70">{app.discordId}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-navy-700/70">{formatDateTime(app.createdAt)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={app.status}
                      disabled={updatingId === app.id}
                      onChange={(e) => changeStatus(app.id, e.target.value as ApplicationStatus)}
                      className={`rounded-full border-0 px-2.5 py-1 text-xs font-semibold outline-none disabled:opacity-50 ${statusClass[app.status]}`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <a
                      href={`/mitarbeiter/bewerbungen/${app.id}`}
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
