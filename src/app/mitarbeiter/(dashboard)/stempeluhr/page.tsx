"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { EmployeePageHeader, StatCard } from "@/components/employee/page-header";
import { Badge } from "@/components/ui/primitives";
import { ClockIcon } from "@/components/ui/icons";
import { usePolling } from "@/lib/use-polling";
import { MANAGEMENT_ROLES } from "@/lib/roles";
import type { TimeClockSummary } from "@/lib/server/db-types";

function formatMinutes(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}:${String(m).padStart(2, "0")} h`;
}

async function callClock(action: "clock-in" | "clock-out", employeeId: string) {
  const res = await fetch("/api/timeclock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, employeeId }),
  });
  return res.json();
}

export default function StempeluhrPage() {
  const { user } = useAuth();
  const { data, refetch } = usePolling<{ summaries: TimeClockSummary[] }>("/api/timeclock", 5000);
  const summaries = data?.summaries ?? [];
  const isManager = user ? MANAGEMENT_ROLES.includes(user.roleKey) : false;

  if (!user) return null;

  const own = summaries.find((s) => s.employeeId === user.id) ?? null;

  return (
    <div>
      <EmployeePageHeader
        title="Stempeluhr"
        description={
          isManager
            ? "Ein- und ausstempeln und die Arbeitszeiten aller Mitarbeiter je Woche und Monat im Blick behalten."
            : "Hier stempelst du dich ein und aus — deine Arbeitszeit der Woche und des Monats im Blick."
        }
      />

      <OwnClock summary={own} employeeId={user.id} refetch={refetch} />

      {isManager ? <TeamOverview summaries={summaries} /> : null}
    </div>
  );
}

function OwnClock({
  summary,
  employeeId,
  refetch,
}: {
  summary: TimeClockSummary | null;
  employeeId: string;
  refetch: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      const json = await callClock(summary?.clockedIn ? "clock-out" : "clock-in", employeeId);
      if (!json.ok) {
        setError(json.error ?? "Aktion fehlgeschlagen.");
        return;
      }
      await refetch();
    } finally {
      setBusy(false);
    }
  }

  if (!summary) return <p className="mt-8 text-sm text-navy-700/60">Stempeluhr wird geladen…</p>;

  return (
    <div className="mt-8 max-w-2xl">
      <div className="rounded-2xl border border-navy-900/8 bg-white p-6 shadow-sm shadow-navy-950/5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-navy-900">Status</div>
            <div className="mt-1">
              <Badge tone={summary.clockedIn ? "green" : "navy"}>
                {summary.clockedIn ? "Eingestempelt" : "Ausgestempelt"}
              </Badge>
            </div>
            {summary.clockedIn && summary.clockedInSince ? (
              <div className="mt-1.5 text-xs text-navy-700/50">
                seit{" "}
                {new Date(summary.clockedInSince).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}{" "}
                Uhr
              </div>
            ) : null}
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={toggle}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${
              summary.clockedIn
                ? "bg-navy-900 text-white hover:bg-navy-800"
                : "bg-amber-500 text-navy-950 hover:bg-amber-400"
            }`}
          >
            <ClockIcon className="h-4 w-4" />
            {busy ? "Wird gebucht…" : summary.clockedIn ? "Ausstempeln" : "Einstempeln"}
          </button>
        </div>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Heute" value={formatMinutes(summary.todayMinutes)} />
          <StatCard label="Diese Woche" value={formatMinutes(summary.weekMinutes)} />
          <StatCard label="Dieser Monat" value={formatMinutes(summary.monthMinutes)} />
        </div>
      </div>
    </div>
  );
}

function TeamOverview({ summaries }: { summaries: TimeClockSummary[] }) {
  const clockedInCount = summaries.filter((s) => s.clockedIn).length;

  return (
    <div className="mt-10">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-600">Alle Mitarbeiter</h2>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Mitarbeiter gesamt" value={String(summaries.length)} />
        <StatCard label="Aktuell eingestempelt" value={String(clockedInCount)} tone={clockedInCount ? "good" : "default"} />
        <StatCard
          label="Std. heute gesamt"
          value={formatMinutes(summaries.reduce((sum, s) => sum + s.todayMinutes, 0))}
        />
        <StatCard
          label="Std. diese Woche gesamt"
          value={formatMinutes(summaries.reduce((sum, s) => sum + s.weekMinutes, 0))}
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-navy-900/8 bg-white shadow-sm shadow-navy-950/5">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-navy-900/8 bg-mist-100 text-xs uppercase tracking-wide text-navy-700/60">
            <tr>
              <th className="px-4 py-3 font-medium">Mitarbeiter</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Heute</th>
              <th className="px-4 py-3 font-medium">Diese Woche</th>
              <th className="px-4 py-3 font-medium">Dieser Monat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-900/6">
            {summaries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-navy-700/60">
                  Noch keine Mitarbeiter-Konten.
                </td>
              </tr>
            ) : (
              summaries.map((s) => (
                <tr key={s.employeeId}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-navy-900">{s.employeeName}</div>
                    <div className="text-xs text-navy-700/60">
                      {s.role} · {s.department}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={s.clockedIn ? "green" : "navy"}>{s.clockedIn ? "Eingestempelt" : "Ausgestempelt"}</Badge>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-navy-800">{formatMinutes(s.todayMinutes)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-navy-800">{formatMinutes(s.weekMinutes)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-navy-800">{formatMinutes(s.monthMinutes)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
