"use client";

import { useState } from "react";
import { CheckIcon } from "@/components/ui/icons";

const DIALOG_LABEL: Record<string, string> = {
  Eingeladen: "Termin für das Kennenlernen",
  Angenommen: "Starttermin",
};

/**
 * Shown before a Bewerbung's status is set to "Eingeladen" or "Angenommen" —
 * both require a date/time that gets woven into the Discord-DM sent to the
 * applicant (see buildApplicationStatusDm in server/discord-bot.ts).
 */
export function ApplicationScheduleDialog({
  status,
  saving,
  onConfirm,
  onCancel,
}: {
  status: string;
  saving: boolean;
  onConfirm: (scheduledAtIso: string) => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  function handleConfirm() {
    if (!date || !time) return;
    const local = new Date(`${date}T${time}`);
    if (Number.isNaN(local.getTime())) return;
    onConfirm(local.toISOString());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-navy-900">{DIALOG_LABEL[status] ?? "Termin"} festlegen</h3>
        <p className="mt-1.5 text-xs text-navy-700/60">
          Datum und Uhrzeit werden direkt in die Discord-Nachricht an die Bewerbung übernommen.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-navy-800" htmlFor="schedule-date">
              Datum
            </label>
            <input
              id="schedule-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-navy-800" htmlFor="schedule-time">
              Uhrzeit
            </label>
            <input
              id="schedule-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-3.5 py-2 text-xs font-medium text-navy-700 hover:bg-mist-100"
          >
            Abbrechen
          </button>
          <button
            type="button"
            disabled={!date || !time || saving}
            onClick={handleConfirm}
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-navy-950 hover:bg-amber-400 disabled:opacity-50"
          >
            <CheckIcon className="h-3.5 w-3.5" />
            {saving ? "Speichert…" : "Status setzen & DM senden"}
          </button>
        </div>
      </div>
    </div>
  );
}
