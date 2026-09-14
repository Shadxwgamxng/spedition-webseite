"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { EmployeePageHeader } from "@/components/employee/page-header";
import { usePolling } from "@/lib/use-polling";
import type { ApplicationStatus, JobApplicationRecord } from "@/lib/server/db-types";

const STATUS_OPTIONS: ApplicationStatus[] = ["Neu", "In Prüfung", "Eingeladen", "Angenommen", "Abgelehnt"];

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function BewerbungDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, refetch } = usePolling<{ application: JobApplicationRecord }>(`/api/applications/${params.id}`, 8000);
  const application = data?.application ?? null;
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function changeStatus(status: ApplicationStatus) {
    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/applications/${params.id}`, {
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
      setSaving(false);
    }
  }

  if (!application) {
    return <p className="text-sm text-navy-700/60">Bewerbung wird geladen…</p>;
  }

  return (
    <div>
      <EmployeePageHeader
        title={`${application.firstName} ${application.lastName}`}
        description={application.position ? `Bewerbung für „${application.position}"` : "Initiativbewerbung"}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-navy-900/8 bg-white p-6 shadow-sm shadow-navy-950/5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-600">Nachricht</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm text-navy-800">
              {application.message || "Keine Nachricht hinterlegt."}
            </p>
          </div>

          <div className="rounded-2xl border border-navy-900/8 bg-white p-6 shadow-sm shadow-navy-950/5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-600">Lebenslauf &amp; Unterlagen</h2>
            {application.cvFileName ? (
              <a
                href={`/api/applications/${application.id}/cv`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-between gap-4 rounded-lg border border-navy-900/8 bg-mist-50 px-3 py-2.5 text-sm font-medium text-navy-800 hover:text-amber-600"
              >
                <span className="truncate">{application.cvFileName}</span>
                <span className="shrink-0 text-xs text-navy-700/50">
                  {application.cvSize !== null ? formatBytes(application.cvSize) : ""}
                </span>
              </a>
            ) : (
              <p className="mt-3 text-sm text-navy-700/50">Keine Datei hochgeladen.</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-navy-900/8 bg-white p-6 shadow-sm shadow-navy-950/5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-600">Kontakt</h2>
            <dl className="mt-3 space-y-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-navy-700/60">E-Mail</dt>
                <dd className="text-right text-navy-900">
                  <a href={`mailto:${application.email}`} className="hover:text-amber-600">
                    {application.email}
                  </a>
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-navy-700/60">Telefon</dt>
                <dd className="text-right text-navy-900">{application.phone || "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-navy-700/60">Discord-ID</dt>
                <dd className="text-right font-mono text-xs text-navy-900">{application.discordId}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-navy-700/60">Eingegangen</dt>
                <dd className="text-right text-navy-900">{formatDateTime(application.createdAt)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-navy-700/60">Letztes Update</dt>
                <dd className="text-right text-navy-900">{formatDateTime(application.statusUpdatedAt)}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-navy-900/8 bg-white p-6 shadow-sm shadow-navy-950/5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-600">Status</h2>
            <select
              value={application.status}
              disabled={saving}
              onChange={(e) => changeStatus(e.target.value as ApplicationStatus)}
              className="mt-3 w-full rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm font-semibold text-navy-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-navy-700/50">
              Eine Statusänderung informiert die Person automatisch per Discord-DM.
            </p>
            {notice ? <p className="mt-2 text-xs text-navy-700">{notice}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
