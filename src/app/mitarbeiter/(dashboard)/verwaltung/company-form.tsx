"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import type { CompanyInfo } from "@/lib/server/db-types";
import { CheckIcon } from "@/components/ui/icons";
import { parseJsonResponse } from "@/lib/parse-json-response";

const MAX_LOGO_BYTES = 1.5 * 1024 * 1024;

const fields: Array<{ key: keyof CompanyInfo; label: string; type?: string }> = [
  { key: "name", label: "Firmenname" },
  { key: "claim", label: "Claim / Slogan" },
  { key: "founded", label: "Gründungsjahr", type: "number" },
  { key: "street", label: "Straße & Hausnummer" },
  { key: "zip", label: "PLZ" },
  { key: "city", label: "Ort" },
  { key: "phone", label: "Telefon" },
  { key: "email", label: "E-Mail (allgemein)", type: "email" },
  { key: "disposition_email", label: "E-Mail Disposition", type: "email" },
  { key: "karriere_email", label: "E-Mail Karriere", type: "email" },
  { key: "mapsQuery", label: "Standort (für Kartensuche)" },
];

export function CompanyForm() {
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [hasLogo, setHasLogo] = useState(false);
  const [logoVersion, setLogoVersion] = useState(0);
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [removeLogoOnSave, setRemoveLogoOnSave] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/company")
      .then((res) => res.json())
      .then((json) => {
        setCompany(json.company);
        setHasLogo(Boolean(json.company.logoMimeType));
      });
  }, []);

  // Object URLs for a freshly picked (not-yet-uploaded) file must be revoked
  // again, or the browser keeps that image data alive for the page's lifetime.
  const logoPreviewUrl = useMemo(() => (pendingLogoFile ? URL.createObjectURL(pendingLogoFile) : null), [pendingLogoFile]);
  useEffect(() => {
    return () => {
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    };
  }, [logoPreviewUrl]);

  function handleLogoSelect(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    setLogoError(null);
    if (selected.size > MAX_LOGO_BYTES) {
      setLogoError("Logo ist zu groß (maximal 1,5 MB).");
      return;
    }
    setRemoveLogoOnSave(false);
    setPendingLogoFile(selected);
  }

  function removeLogo() {
    setPendingLogoFile(null);
    setRemoveLogoOnSave(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setLogoError(null);
    const form = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = {};
    for (const field of fields) {
      const raw = form.get(field.key);
      payload[field.key] = field.type === "number" ? Number(raw) : String(raw ?? "");
    }

    try {
      if (pendingLogoFile) {
        const logoForm = new FormData();
        logoForm.append("file", pendingLogoFile);
        const logoRes = await fetch("/api/company/logo", { method: "POST", body: logoForm });
        const logoJson = await parseJsonResponse(logoRes);
        if (!logoRes.ok || logoJson.ok === false) {
          setLogoError(logoJson.error ?? "Logo konnte nicht hochgeladen werden.");
          return;
        }
        setHasLogo(true);
        setPendingLogoFile(null);
        setLogoVersion((v) => v + 1);
      } else if (removeLogoOnSave) {
        await fetch("/api/company/logo", { method: "DELETE" });
        setHasLogo(false);
      }
      setRemoveLogoOnSave(false);

      const res = await fetch("/api/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await parseJsonResponse(res);
      if (!res.ok || json.ok === false) {
        setLogoError(json.error ?? "Speichern fehlgeschlagen.");
        return;
      }
      setCompany(json.company as CompanyInfo);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (!company) return <p className="text-sm text-navy-700/60">Wird geladen…</p>;

  const showLogo = logoPreviewUrl ?? (hasLogo && !removeLogoOnSave ? `/api/company/logo?v=${logoVersion}` : null);

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-4 rounded-2xl border border-navy-900/8 bg-white p-6 shadow-sm shadow-navy-950/5 sm:grid-cols-2"
    >
      <div className="sm:col-span-2">
        <label className="mb-1.5 block text-xs font-medium text-navy-800">Firmenlogo</label>
        <p className="mb-2 text-xs text-navy-700/50">
          Erscheint u. a. im Briefkopf automatisch erstellter Dokumente (z. B. Arbeitsverträge).
        </p>
        <div className="flex items-center gap-4">
          {showLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={showLogo} alt="Firmenlogo" className="h-16 w-16 rounded-lg border border-navy-900/10 object-contain" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-navy-900/15 text-[10px] text-navy-700/40">
              Kein Logo
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleLogoSelect}
              className="text-xs text-navy-700/70 file:mr-3 file:rounded-full file:border-0 file:bg-navy-900/5 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-navy-800 hover:file:bg-navy-900/10"
            />
            {showLogo ? (
              <button
                type="button"
                onClick={removeLogo}
                className="self-start text-xs font-semibold text-red-600 hover:text-red-700"
              >
                Logo entfernen
              </button>
            ) : null}
            {logoError ? <p className="text-xs text-red-600">{logoError}</p> : null}
          </div>
        </div>
      </div>

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
