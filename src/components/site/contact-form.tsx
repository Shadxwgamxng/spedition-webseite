"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/primitives";
import { CheckIcon } from "@/components/ui/icons";

const DISCORD_INVITE_URL = "https://discord.gg/eUyQtdRbWm";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          company: form.get("company"),
          email: form.get("email"),
          phone: form.get("phone"),
          discordId: form.get("discordId"),
          message: form.get("message"),
        }),
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) {
        setError(json.error ?? "Nachricht konnte nicht übermittelt werden.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Verbindung zum Server fehlgeschlagen. Bitte versuchen Sie es erneut.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6">
        <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <div>
          <div className="font-semibold text-navy-900">Vielen Dank für Ihre Nachricht!</div>
          <p className="mt-1 text-sm text-navy-700/75">
            Wir haben Ihre Anfrage erhalten und melden uns schnellstmöglich per Discord-DM bei Ihnen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-navy-900/8 bg-white p-6 shadow-sm shadow-navy-950/5">
      <div className="flex flex-col gap-4 rounded-2xl border-2 border-[#5865F2]/30 bg-[#5865F2]/5 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-bold uppercase tracking-wide text-[#5865F2]">Wichtiger Hinweis</div>
          <p className="mt-1.5 text-sm font-medium text-navy-900">
            Sie müssen auf unserem Discord-Server sein, damit wir Ihnen antworten können — ohne Mitgliedschaft
            können wir Ihnen dort keine Nachrichten schicken.
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
        <Field label="Name" name="name" required />
        <Field label="Unternehmen" name="company" />
        <Field label="E-Mail" name="email" type="email" required />
        <Field label="Telefon" name="phone" type="tel" />
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
        <label className="mb-1.5 block text-sm font-medium text-navy-800" htmlFor="message">
          Nachricht
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className="w-full rounded-xl border border-navy-900/15 bg-white px-3.5 py-2.5 text-sm text-navy-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" icon={false} disabled={submitting}>
        {submitting ? "Wird gesendet…" : "Nachricht senden"}
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
