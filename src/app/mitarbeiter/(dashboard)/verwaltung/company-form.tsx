"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { CompanyInfo } from "@/lib/server/db-types";
import { CheckIcon } from "@/components/ui/icons";

const fields: Array<{ key: keyof CompanyInfo; label: string; type?: string }> = [
  { key: "name", label: "Firmenname" },
  { key: "claim", label: "Claim / Slogan" },
  { key: "founded", label: "Gründungsjahr", type: "number" },
  { key: "street", label: "Straße & Hausnummer" },
  { key: "zip", label: "PLZ" },
  { key: "city", label: "Ort" },
  { key: "phone", label: "Telefon" },
  { key: "fax", label: "Fax" },
  { key: "email", label: "E-Mail (allgemein)", type: "email" },
  { key: "disposition_email", label: "E-Mail Disposition", type: "email" },
  { key: "karriere_email", label: "E-Mail Karriere", type: "email" },
  { key: "mapsQuery", label: "Standort (für Kartensuche)" },
];

export function CompanyForm() {
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/company")
      .then((res) => res.json())
      .then((json) => setCompany(json.company));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    const form = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = {};
    for (const field of fields) {
      const raw = form.get(field.key);
      payload[field.key] = field.type === "number" ? Number(raw) : String(raw ?? "");
    }
    const res = await fetch("/api/company", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setCompany(json.company);
    setSaving(false);
    setSaved(true);
  }

  if (!company) return <p className="text-sm text-navy-700/60">Wird geladen…</p>;

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-4 rounded-2xl border border-navy-900/8 bg-white p-6 shadow-sm shadow-navy-950/5 sm:grid-cols-2"
    >
      {fields.map((field) => (
        <div key={field.key}>
          <label className="mb-1.5 block text-xs font-medium text-navy-800" htmlFor={field.key}>
            {field.label}
          </label>
          <input
            id={field.key}
            name={field.key}
            type={field.type ?? "text"}
            defaultValue={String(company[field.key] ?? "")}
            className="w-full rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
      ))}
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
