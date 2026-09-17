"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { AboutPageInfo } from "@/lib/server/db-types";
import { CheckIcon } from "@/components/ui/icons";

const fields: Array<{ key: keyof AboutPageInfo; label: string; type?: "text" | "textarea"; help?: string }> = [
  { key: "heroEyebrow", label: "Kicker über der Überschrift" },
  { key: "heroTitle", label: "Überschrift (Hero)" },
  {
    key: "heroDescription",
    label: "Einleitungstext (Hero)",
    type: "textarea",
    help: "{founded} wird automatisch durch das Gründungsjahr aus den Unternehmensdaten ersetzt",
  },
  { key: "storyEyebrow", label: "Kicker „Unsere Geschichte“" },
  { key: "storyTitle", label: "Überschrift „Unsere Geschichte“" },
  { key: "storyDescription", label: "Beschreibung „Unsere Geschichte“", type: "textarea" },
  { key: "storyParagraph", label: "Zusatzabsatz darunter", type: "textarea" },
  { key: "valuesEyebrow", label: "Kicker „Unsere Werte“" },
  { key: "valuesTitle", label: "Überschrift „Unsere Werte“" },
  { key: "ctaTitle", label: "Überschrift Abschluss-Banner" },
  { key: "ctaText", label: "Text Abschluss-Banner", type: "textarea" },
];

export function AboutPageForm() {
  const [aboutPage, setAboutPage] = useState<AboutPageInfo | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/about-page")
      .then((res) => res.json())
      .then((json) => setAboutPage(json.aboutPage));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    const form = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = {};
    for (const field of fields) {
      payload[field.key] = String(form.get(field.key) ?? "");
    }

    try {
      const res = await fetch("/api/about-page", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) {
        setError(json.error ?? "Speichern fehlgeschlagen.");
        return;
      }
      setAboutPage(json.aboutPage as AboutPageInfo);
      setSaved(true);
    } catch {
      setError("Verbindung zum Server fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  if (!aboutPage) return <p className="text-sm text-navy-700/60">Wird geladen…</p>;

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-4 rounded-2xl border border-navy-900/8 bg-white p-6 shadow-sm shadow-navy-950/5 sm:grid-cols-2"
    >
      <p className="text-xs text-navy-700/50 sm:col-span-2">
        Texte der Seite <code className="text-navy-700/70">/ueber-uns</code>. Meilensteine, Werte und die drei
        Vorteile-Kacheln darunter pflegst du in den eigenen Reitern.
      </p>

      {fields.map((field) => (
        <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
          <label className="mb-1.5 block text-xs font-medium text-navy-800" htmlFor={field.key}>
            {field.label}
            {field.help ? <span className="ml-1 font-normal text-navy-700/50">({field.help})</span> : null}
          </label>
          {field.type === "textarea" ? (
            <textarea
              id={field.key}
              name={field.key}
              rows={3}
              defaultValue={String(aboutPage[field.key] ?? "")}
              className="w-full rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          ) : (
            <input
              id={field.key}
              name={field.key}
              type="text"
              defaultValue={String(aboutPage[field.key] ?? "")}
              className="w-full rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          )}
        </div>
      ))}

      {error ? <p className="text-sm text-red-600 sm:col-span-2">{error}</p> : null}

      <div className="sm:col-span-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-navy-950 hover:bg-amber-400 disabled:opacity-60"
        >
          <CheckIcon className="h-4 w-4" />
          {saving ? "Speichert…" : "Speichern"}
        </button>
        {saved ? <span className="text-xs text-emerald-600">Gespeichert.</span> : null}
      </div>
    </form>
  );
}
