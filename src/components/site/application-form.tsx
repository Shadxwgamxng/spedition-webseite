"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/primitives";
import { CheckIcon } from "@/components/ui/icons";
import type { JobRecord } from "@/lib/server/db-types";

const DISCORD_INVITE_URL = "https://discord.gg/eUyQtdRbWm";

export function ApplicationForm({
  initialPosition = "",
  jobs,
}: {
  initialPosition?: string;
  jobs: JobRecord[];
}) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/applications", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok || json.ok === false) {
        setError(json.error ?? "Bewerbung konnte nicht übermittelt werden.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Verbindung zum Server fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8">
        <CheckIcon className="h-6 w-6 text-emerald-600" />
        <div>
          <div className="text-lg font-semibold text-navy-900">Bewerbung eingegangen!</div>
          <p className="mt-1 text-sm text-navy-700/75">
            Vielen Dank für dein Interesse an Baltic Freight. Unser Team aus dem Bereich Personal &amp; Recruiting
            meldet sich innerhalb der nächsten Werktage bei dir.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-navy-900/8 bg-white p-6 shadow-sm shadow-navy-950/5 sm:p-8">
      <div className="flex flex-col gap-4 rounded-2xl border-2 border-[#5865F2]/30 bg-[#5865F2]/5 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-bold uppercase tracking-wide text-[#5865F2]">Wichtiger Hinweis</div>
          <p className="mt-1.5 text-sm font-medium text-navy-900">
            Du musst auf unserem Discord-Server sein, damit wir dich zu deiner Bewerbung kontaktieren können — ohne
            Mitgliedschaft können wir dir dort keine Nachrichten schicken.
          </p>
        </div>
        <a
          href={DISCORD_INVITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#5865F2] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4752c4]"
        >
          Discord beitreten
        </a>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Vorname" name="firstName" required />
        <Field label="Nachname" name="lastName" required />
        <Field label="E-Mail" name="email" type="email" required />
        <Field label="Telefon" name="phone" type="tel" required />
        <Field
          label="Discord-Nutzer-ID"
          name="discordId"
          required
          placeholder="z. B. 123456789012345678"
          hint={
            <>
              Einstellungen → Erweitert → Entwicklermodus aktivieren, dann Rechtsklick auf den eigenen Namen →
              &bdquo;Nutzer-ID kopieren&ldquo;.
            </>
          }
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-navy-800" htmlFor="position">
          Gewünschte Position
        </label>
        <select
          id="position"
          name="position"
          defaultValue={initialPosition}
          className="w-full rounded-xl border border-navy-900/15 bg-white px-3.5 py-2.5 text-sm text-navy-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
        >
          <option value="">Initiativbewerbung</option>
          {jobs.map((job) => (
            <option key={job.slug} value={job.title}>
              {job.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-navy-800" htmlFor="message">
          Kurz zu dir
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          placeholder="Erzähl uns kurz von deiner Erfahrung und warum du zu Baltic Freight möchtest."
          className="w-full rounded-xl border border-navy-900/15 bg-white px-3.5 py-2.5 text-sm text-navy-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-navy-800" htmlFor="cv">
          Lebenslauf &amp; Unterlagen (PDF)
        </label>
        <label
          htmlFor="cv"
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-navy-900/15 px-4 py-8 text-center transition hover:border-amber-500 hover:bg-amber-50/40"
        >
          <span className="text-sm font-medium text-navy-800">
            {fileName ?? "Datei auswählen oder hierher ziehen"}
          </span>
          <span className="mt-1 text-xs text-navy-700/50">PDF, max. 10 MB</span>
          <input
            id="cv"
            name="cv"
            type="file"
            accept="application/pdf"
            className="sr-only"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
        </label>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" icon={false} disabled={submitting} className="w-full justify-center sm:w-auto">
        {submitting ? "Wird gesendet…" : "Bewerbung absenden"}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  hint?: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-navy-800" htmlFor={name}>
        {label}
        {required ? <span className="text-amber-600"> *</span> : null}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-navy-900/15 bg-white px-3.5 py-2.5 text-sm text-navy-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
      />
      {hint ? <p className="mt-1 text-xs text-navy-700/50">{hint}</p> : null}
    </div>
  );
}
