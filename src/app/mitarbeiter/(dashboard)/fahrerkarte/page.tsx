"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { EmployeePageHeader, StatCard } from "@/components/employee/page-header";
import { Badge, Button } from "@/components/ui/primitives";
import { usePolling } from "@/lib/use-polling";
import { BellIcon, CheckIcon, CoffeeIcon } from "@/components/ui/icons";
import type { DriverCardRecord } from "@/lib/server/db-types";

type DriverCardsResponse = { driverCards: DriverCardRecord[] };

const MAX_DAILY_MIN = 9 * 60;
const MAX_WEEKLY_MIN = 56 * 60;

function formatMinutes(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}:${String(m).padStart(2, "0")} h`;
}

async function callCard(action: string, driverName: string, extra?: Record<string, unknown>) {
  const res = await fetch("/api/driver-cards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, driverName, ...extra }),
  });
  return res.json();
}

export default function FahrerkartePage() {
  const { user } = useAuth();
  const { data, refetch } = usePolling<DriverCardsResponse>("/api/driver-cards", 4000);
  const cards = data?.driverCards ?? [];

  if (!user) return null;

  return (
    <div>
      <EmployeePageHeader
        title="Digitale Fahrerkarte"
        description={
          user.roleKey === "fahrer"
            ? "Deine Fahrerkarte aktivieren, Pausen erfassen und Erinnerungen der Disposition sehen."
            : "Lenk- und Ruhezeiten aller Fahrer in Echtzeit im Blick behalten und bei Überschreitungen erinnern."
        }
      />
      {user.roleKey === "fahrer" ? (
        <OwnCard card={cards.find((c) => c.driverName === user.name) ?? null} driverName={user.name} refetch={refetch} />
      ) : (
        <AllCards cards={cards} refetch={refetch} />
      )}
    </div>
  );
}

function OwnCard({
  card,
  driverName,
  refetch,
}: {
  card: DriverCardRecord | null;
  driverName: string;
  refetch: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  if (!card) return <p className="text-sm text-navy-700/60">Fahrerkarte wird geladen…</p>;

  const unread = card.reminders.filter((r) => !r.read);
  const dailyPct = Math.min(100, (card.drivingTodayMinutes / MAX_DAILY_MIN) * 100);
  const weeklyPct = Math.min(100, (card.drivingWeekMinutes / MAX_WEEKLY_MIN) * 100);

  async function run(action: string) {
    setBusy(true);
    try {
      await callCard(action, driverName);
      await refetch();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 max-w-2xl space-y-6">
      {unread.map((reminder) => (
        <div key={reminder.id} className="flex items-start gap-3 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4">
          <BellIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-navy-900">Erinnerung von der Disposition</div>
            <p className="mt-1 text-sm text-navy-800">{reminder.text}</p>
            <time className="mt-1 block text-xs text-navy-700/50">
              {new Date(reminder.at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr
            </time>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => callCard("ack-reminder", driverName, { reminderId: reminder.id }).then(refetch)}
            className="shrink-0 rounded-full border border-navy-900/15 px-3 py-1.5 text-xs font-semibold text-navy-800 hover:bg-white"
          >
            Verstanden
          </button>
        </div>
      ))}

      <div className="rounded-2xl border border-navy-900/8 bg-white p-6 shadow-sm shadow-navy-950/5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-navy-900">Status</div>
            <div className="mt-1">
              <Badge tone={card.active ? "green" : "navy"}>{card.active ? "Aktiv" : "Nicht aktiv"}</Badge>
              {card.onBreak ? (
                <span className="ml-2">
                  <Badge tone="amber">Pause läuft</Badge>
                </span>
              ) : null}
            </div>
          </div>
          <Button
            icon={false}
            variant={card.active ? "outline" : "primary"}
            className={busy ? "opacity-60" : ""}
            onClick={() => run(card.active ? "deactivate" : "activate")}
          >
            {card.active ? "Fahrerkarte deaktivieren" : "Fahrerkarte aktivieren"}
          </Button>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <div className="flex justify-between text-xs text-navy-700/60">
              <span>Lenkzeit heute</span>
              <span>
                {formatMinutes(card.drivingTodayMinutes)} / {formatMinutes(MAX_DAILY_MIN)}
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-navy-900/8">
              <div
                className={`h-full rounded-full ${dailyPct > 85 ? "bg-amber-500" : "bg-navy-700"}`}
                style={{ width: `${dailyPct}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-navy-700/60">
              <span>Lenkzeit diese Woche</span>
              <span>
                {formatMinutes(card.drivingWeekMinutes)} / {formatMinutes(MAX_WEEKLY_MIN)}
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-navy-900/8">
              <div
                className={`h-full rounded-full ${weeklyPct > 85 ? "bg-amber-500" : "bg-navy-700"}`}
                style={{ width: `${weeklyPct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-xl bg-mist-100 p-4">
          <div className="flex items-center gap-2.5">
            <CoffeeIcon className="h-5 w-5 text-navy-700" />
            <div>
              <div className="text-sm font-medium text-navy-900">
                {card.onBreak ? "Pause läuft" : "Heute genommene Pause"}
              </div>
              <div className="text-xs text-navy-700/60">
                {card.onBreak && card.breakStartedAt
                  ? `seit ${new Date(card.breakStartedAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr`
                  : formatMinutes(card.breakTakenTodayMinutes)}
              </div>
            </div>
          </div>
          <button
            type="button"
            disabled={busy || !card.active}
            onClick={() => run(card.onBreak ? "break-end" : "break-start")}
            className="rounded-full bg-navy-900 px-4 py-2 text-xs font-semibold text-white hover:bg-navy-800 disabled:opacity-40"
          >
            {card.onBreak ? "Pause beenden" : "Pause starten"}
          </button>
        </div>
        {!card.active ? (
          <p className="mt-3 text-xs text-navy-700/50">Fahrerkarte muss aktiv sein, um eine Pause zu erfassen.</p>
        ) : null}
      </div>
    </div>
  );
}

function AllCards({ cards, refetch }: { cards: DriverCardRecord[]; refetch: () => Promise<void> }) {
  const [reminderFor, setReminderFor] = useState<string | null>(null);
  const [reminderText, setReminderText] = useState("Bitte gesetzliche Lenk- und Ruhezeiten beachten.");
  const [sending, setSending] = useState(false);

  const violations = cards.filter(
    (c) => c.drivingTodayMinutes > MAX_DAILY_MIN || c.drivingWeekMinutes > MAX_WEEKLY_MIN,
  ).length;

  async function sendReminder(driverName: string) {
    setSending(true);
    try {
      await callCard("remind", driverName, { text: reminderText });
      await refetch();
      setReminderFor(null);
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Aktive Fahrerkarten" value={String(cards.filter((c) => c.active).length)} />
        <StatCard label="Überschreitungen" value={String(violations)} tone={violations ? "warn" : "good"} />
        <StatCard label="Max. Lenkzeit / Tag" value={formatMinutes(MAX_DAILY_MIN)} hint="gesetzlicher Rahmen" />
        <StatCard label="Max. Lenkzeit / Woche" value={formatMinutes(MAX_WEEKLY_MIN)} hint="gesetzlicher Rahmen" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {cards.map((card) => {
          const dailyPct = Math.min(100, (card.drivingTodayMinutes / MAX_DAILY_MIN) * 100);
          const weeklyPct = Math.min(100, (card.drivingWeekMinutes / MAX_WEEKLY_MIN) * 100);
          const violation = card.drivingTodayMinutes > MAX_DAILY_MIN || card.drivingWeekMinutes > MAX_WEEKLY_MIN;
          const unread = card.reminders.filter((r) => !r.read).length;

          return (
            <div
              key={card.driverName}
              className={`rounded-2xl border bg-white p-5 shadow-sm shadow-navy-950/5 ${
                violation ? "border-red-400/50" : "border-navy-900/8"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-navy-900">{card.driverName}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge tone={card.active ? "green" : "navy"}>{card.active ? "Aktiv" : "Inaktiv"}</Badge>
                    {card.onBreak ? <Badge tone="amber">Pause</Badge> : null}
                    {violation ? <Badge tone="amber">Überschreitung</Badge> : null}
                    {unread ? <Badge tone="navy">{unread} Erinnerung(en) ungelesen</Badge> : null}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReminderFor(reminderFor === card.driverName ? null : card.driverName)}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-navy-900/15 px-3 py-1.5 text-xs font-semibold text-navy-800 hover:bg-mist-100"
                >
                  <BellIcon className="h-3.5 w-3.5" />
                  Erinnerung
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-navy-700/60">
                    <span>Lenkzeit heute</span>
                    <span>{formatMinutes(card.drivingTodayMinutes)}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-navy-900/8">
                    <div
                      className={`h-full rounded-full ${dailyPct > 100 ? "bg-red-500" : dailyPct > 85 ? "bg-amber-500" : "bg-navy-700"}`}
                      style={{ width: `${Math.min(100, dailyPct)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-navy-700/60">
                    <span>Lenkzeit diese Woche</span>
                    <span>{formatMinutes(card.drivingWeekMinutes)}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-navy-900/8">
                    <div
                      className={`h-full rounded-full ${weeklyPct > 100 ? "bg-red-500" : weeklyPct > 85 ? "bg-amber-500" : "bg-navy-700"}`}
                      style={{ width: `${Math.min(100, weeklyPct)}%` }}
                    />
                  </div>
                </div>
              </div>

              {reminderFor === card.driverName ? (
                <div className="mt-4 space-y-2 rounded-xl bg-mist-100 p-3">
                  <textarea
                    value={reminderText}
                    onChange={(e) => setReminderText(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-xs outline-none focus:border-amber-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setReminderFor(null)}
                      className="rounded-full px-3 py-1.5 text-xs font-medium text-navy-700 hover:bg-white"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="button"
                      disabled={sending}
                      onClick={() => sendReminder(card.driverName)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-navy-950 hover:bg-amber-400 disabled:opacity-50"
                    >
                      <CheckIcon className="h-3.5 w-3.5" />
                      Senden
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
