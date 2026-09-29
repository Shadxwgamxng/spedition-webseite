"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { EmployeePageHeader, StatCard } from "@/components/employee/page-header";
import { Badge } from "@/components/ui/primitives";
import { CalendarIcon } from "@/components/ui/icons";
import { usePolling } from "@/lib/use-polling";
import type { AbsenceRequestKind, AbsenceRequestRecord, AbsenceRequestStatus } from "@/lib/server/db-types";

const KIND_LABEL: Record<AbsenceRequestKind, string> = {
  krankmeldung: "Krankmeldung",
  urlaub: "Urlaub",
};

function statusTone(status: AbsenceRequestStatus): "navy" | "amber" | "green" | "red" {
  if (status === "genehmigt") return "green";
  if (status === "abgelehnt") return "red";
  return "amber";
}

function statusLabel(request: AbsenceRequestRecord): string {
  if (request.kind === "krankmeldung") return "Gemeldet";
  if (request.status === "eingereicht") return "Ausstehend";
  return request.status === "genehmigt" ? "Genehmigt" : "Abgelehnt";
}

function formatDate(value: string): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function KrankmeldungUrlaubPage() {
  const { user } = useAuth();
  const { data, refetch } = usePolling<{ requests: AbsenceRequestRecord[]; isManager: boolean }>(
    "/api/absence-requests",
    8000,
  );
  const requests = data?.requests ?? [];
  const isManager = data?.isManager ?? false;

  if (!user) return null;

  const own = isManager ? requests.filter((r) => r.employeeId === user.id) : requests;

  return (
    <div>
      <EmployeePageHeader
        title="Krankmeldung und Urlaub einreichen"
        description={
          isManager
            ? "Eigene Krankmeldungen/Urlaubsanträge einreichen und die Anträge aller Mitarbeiter prüfen — Urlaub muss genehmigt werden."
            : "Melde dich krank oder reiche einen Urlaubsantrag ein. Eine Krankmeldung ist sofort gültig, Urlaub muss von der Führung genehmigt werden."
        }
      />

      <SubmitForm refetch={refetch} />

      <OwnRequests requests={own} />

      {isManager ? <ManagerOverview requests={requests} refetch={refetch} /> : null}
    </div>
  );
}

function SubmitForm({ refetch }: { refetch: () => Promise<void> }) {
  const [kind, setKind] = useState<AbsenceRequestKind>("krankmeldung");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setNotice(null);
    if (!startDate || !endDate) {
      setError("Bitte Start- und Enddatum angeben.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/absence-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, startDate, endDate, note }),
      });
      const json = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Antrag konnte nicht eingereicht werden.");
        return;
      }
      setNotice(kind === "krankmeldung" ? "Krankmeldung wurde erfasst." : "Urlaubsantrag wurde eingereicht und wartet auf Genehmigung.");
      setStartDate("");
      setEndDate("");
      setNote("");
      await refetch();
    } catch {
      setError("Verbindung zum Server fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl rounded-2xl border border-navy-900/8 bg-white p-6 shadow-sm shadow-navy-950/5">
      <div className="flex gap-2">
        {(["krankmeldung", "urlaub"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              kind === k ? "bg-amber-400 text-navy-950" : "bg-mist-100 text-navy-700 hover:bg-mist-200"
            }`}
          >
            {KIND_LABEL[k]}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-navy-700/50">Von</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-navy-900/15 px-3 py-2 text-sm text-navy-900"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-navy-700/50">Bis</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-navy-900/15 px-3 py-2 text-sm text-navy-900"
          />
        </label>
      </div>

      <label className="mt-4 block">
        <span className="text-xs font-medium uppercase tracking-wide text-navy-700/50">Anmerkung (optional)</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-lg border border-navy-900/15 px-3 py-2 text-sm text-navy-900"
        />
      </label>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      {notice ? <p className="mt-3 text-sm text-emerald-600">{notice}</p> : null}

      <button
        type="button"
        disabled={saving}
        onClick={submit}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800 disabled:opacity-60"
      >
        <CalendarIcon className="h-4 w-4" />
        {saving ? "Wird eingereicht…" : kind === "krankmeldung" ? "Krankmeldung absenden" : "Urlaub beantragen"}
      </button>
    </div>
  );
}

function OwnRequests({ requests }: { requests: AbsenceRequestRecord[] }) {
  const sorted = [...requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="mt-10 max-w-2xl">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-600">Meine Anträge</h2>
      <div className="mt-4 space-y-3">
        {sorted.length === 0 ? (
          <p className="text-sm text-navy-700/60">Noch keine Krankmeldungen oder Urlaubsanträge.</p>
        ) : (
          sorted.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-2xl border border-navy-900/8 bg-white p-4 shadow-sm shadow-navy-950/5"
            >
              <div>
                <div className="text-sm font-semibold text-navy-900">
                  {KIND_LABEL[r.kind]} · {formatDate(r.startDate)} – {formatDate(r.endDate)}
                </div>
                {r.note ? <div className="mt-1 text-xs text-navy-700/60">{r.note}</div> : null}
                {r.decidedBy ? (
                  <div className="mt-1 text-xs text-navy-700/50">
                    Entschieden von {r.decidedBy} am {formatDate(r.decidedAt ?? "")}
                  </div>
                ) : null}
              </div>
              <Badge tone={statusTone(r.status)}>{statusLabel(r)}</Badge>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ManagerOverview({ requests, refetch }: { requests: AbsenceRequestRecord[]; refetch: () => Promise<void> }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const pendingCount = requests.filter((r) => r.kind === "urlaub" && r.status === "eingereicht").length;
  const sickCount = requests.filter((r) => r.kind === "krankmeldung").length;
  const sorted = [...requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  async function decide(id: string, decision: "genehmigt" | "abgelehnt") {
    setBusyId(id);
    try {
      await fetch(`/api/absence-requests/${id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      await refetch();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mt-10">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-600">Alle Mitarbeiter</h2>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Anträge gesamt" value={String(requests.length)} />
        <StatCard label="Urlaub ausstehend" value={String(pendingCount)} tone={pendingCount ? "warn" : "default"} />
        <StatCard label="Krankmeldungen" value={String(sickCount)} />
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-navy-900/8 bg-white shadow-sm shadow-navy-950/5">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-navy-900/8 bg-mist-100 text-xs uppercase tracking-wide text-navy-700/60">
            <tr>
              <th className="px-4 py-3 font-medium">Mitarbeiter</th>
              <th className="px-4 py-3 font-medium">Art</th>
              <th className="px-4 py-3 font-medium">Zeitraum</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Aktion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-900/6">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-navy-700/60">
                  Noch keine Anträge.
                </td>
              </tr>
            ) : (
              sorted.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-medium text-navy-900">{r.employeeName}</td>
                  <td className="px-4 py-3 text-navy-800">{KIND_LABEL[r.kind]}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-navy-800">
                    {formatDate(r.startDate)} – {formatDate(r.endDate)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(r.status)}>{statusLabel(r)}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {r.kind === "urlaub" && r.status === "eingereicht" ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={busyId === r.id}
                          onClick={() => decide(r.id, "genehmigt")}
                          className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                        >
                          Genehmigen
                        </button>
                        <button
                          type="button"
                          disabled={busyId === r.id}
                          onClick={() => decide(r.id, "abgelehnt")}
                          className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-60"
                        >
                          Ablehnen
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-navy-700/40">—</span>
                    )}
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
