"use client";

import { useRef, useState, type FormEvent } from "react";
import { usePolling } from "@/lib/use-polling";
import { CheckIcon, FolderIcon, TrashIcon, UploadIcon } from "@/components/ui/icons";
import type { EmployeeUser } from "@/lib/auth";

type Employee = EmployeeUser & { id: string };
type PersonnelDocument = { id: string; fileName: string; mimeType: string; size: number; uploadedAt: string };
type PersonnelFile = {
  id: string;
  employeeId: string;
  birthDate: string;
  birthPlace: string;
  nationality: string;
  street: string;
  zip: string;
  city: string;
  phonePrivate: string;
  emailPrivate: string;
  hireDate: string;
  employmentType: string;
  taxId: string;
  socialSecurityNumber: string;
  healthInsurance: string;
  iban: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  notes: string;
  documents: PersonnelDocument[];
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function PersonnelFilesManager() {
  const employees = usePolling<{ employees: Employee[] }>("/api/employees", 6000);
  const files = usePolling<{ personnelFiles: PersonnelFile[] }>("/api/personnel-files", 6000);
  const [openId, setOpenId] = useState<string | null>(null);

  const employeeList = employees.data?.employees ?? [];
  const fileList = files.data?.personnelFiles ?? [];

  async function refetchAll() {
    await Promise.all([employees.refetch(), files.refetch()]);
  }

  return (
    <div>
      <div className="text-sm text-navy-700/60">
        {employeeList.length} Personalakten — wird automatisch mit jedem Mitarbeiter-Konto angelegt.
      </div>

      <div className="mt-4 space-y-2">
        {employeeList.length === 0 ? (
          <p className="rounded-2xl border border-navy-900/8 bg-white p-6 text-sm text-navy-700/60">
            Noch keine Mitarbeiter-Konten — Personalakten erscheinen hier automatisch, sobald welche angelegt werden.
          </p>
        ) : (
          employeeList.map((employee) => {
            const file = fileList.find((f) => f.employeeId === employee.id);
            const open = openId === employee.id;
            return (
              <div key={employee.id} className="rounded-xl border border-navy-900/8 bg-white">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : employee.id)}
                  className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 truncate text-sm font-semibold text-navy-900">
                      <FolderIcon className="h-4 w-4 shrink-0 text-amber-600" />
                      {employee.name}
                    </div>
                    <div className="truncate text-xs text-navy-700/60">
                      {employee.role} · {employee.department}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-xs text-navy-700/60">
                    {file ? `${file.documents.length} Dokument${file.documents.length === 1 ? "" : "e"}` : "…"}
                    <span className="font-semibold text-navy-800">{open ? "Schließen" : "Akte öffnen"}</span>
                  </div>
                </button>
                {open && file ? (
                  <div className="border-t border-navy-900/8 p-4">
                    <PersonnelFileForm file={file} onSaved={refetchAll} />
                    <PersonnelDocuments file={file} onChanged={refetchAll} />
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function PersonnelFileForm({ file, onSaved }: { file: PersonnelFile; onSaved: () => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const payload: Record<string, string> = {};
    for (const [key, value] of form.entries()) {
      payload[key] = String(value);
    }
    try {
      const res = await fetch(`/api/personnel-files/${file.employeeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) {
        setError(json.error ?? "Speichern fehlgeschlagen.");
        return;
      }
      await onSaved();
      setSaved(true);
    } catch {
      setError("Verbindung zum Server fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Geburtsdatum" name="birthDate" type="date" defaultValue={file.birthDate} />
      <Field label="Geburtsort" name="birthPlace" defaultValue={file.birthPlace} />
      <Field label="Staatsangehörigkeit" name="nationality" defaultValue={file.nationality} />
      <Field label="Straße & Hausnummer" name="street" defaultValue={file.street} />
      <Field label="PLZ" name="zip" defaultValue={file.zip} />
      <Field label="Ort" name="city" defaultValue={file.city} />
      <Field label="Private Telefonnummer" name="phonePrivate" defaultValue={file.phonePrivate} />
      <Field label="Private E-Mail" name="emailPrivate" type="email" defaultValue={file.emailPrivate} />
      <Field label="Eintrittsdatum" name="hireDate" type="date" defaultValue={file.hireDate} />
      <Field label="Beschäftigungsart" name="employmentType" placeholder="z. B. Vollzeit" defaultValue={file.employmentType} />
      <Field label="Steuer-ID" name="taxId" defaultValue={file.taxId} />
      <Field label="Sozialversicherungsnummer" name="socialSecurityNumber" defaultValue={file.socialSecurityNumber} />
      <Field label="Krankenkasse" name="healthInsurance" defaultValue={file.healthInsurance} />
      <Field label="IBAN" name="iban" defaultValue={file.iban} />
      <Field label="Notfallkontakt: Name" name="emergencyContactName" defaultValue={file.emergencyContactName} />
      <Field label="Notfallkontakt: Telefon" name="emergencyContactPhone" defaultValue={file.emergencyContactPhone} />
      <div className="sm:col-span-2 lg:col-span-3">
        <label className="mb-1.5 block text-xs font-medium text-navy-800" htmlFor={`notes-${file.employeeId}`}>
          Notizen
        </label>
        <textarea
          id={`notes-${file.employeeId}`}
          name="notes"
          rows={3}
          defaultValue={file.notes}
          className="w-full rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
        />
      </div>

      {error ? <p className="text-sm text-red-600 sm:col-span-2 lg:col-span-3">{error}</p> : null}
      <div className="sm:col-span-2 lg:col-span-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-navy-950 hover:bg-amber-400 disabled:opacity-60"
        >
          <CheckIcon className="h-4 w-4" />
          {saving ? "Speichert…" : saved ? "Gespeichert ✓" : "Speichern"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-navy-800" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
      />
    </div>
  );
}

function PersonnelDocuments({ file, onChanged }: { file: PersonnelFile; onChanged: () => Promise<void> }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleUpload() {
    const selected = inputRef.current?.files?.[0];
    if (!selected) return;
    setUploadError(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", selected);
      const res = await fetch(`/api/personnel-files/${file.employeeId}/documents`, { method: "POST", body });
      const json = await res.json();
      if (!res.ok || json.ok === false) {
        setUploadError(json.error ?? "Hochladen fehlgeschlagen.");
        return;
      }
      await onChanged();
      if (inputRef.current) inputRef.current.value = "";
    } catch {
      setUploadError("Verbindung zum Server fehlgeschlagen.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(documentId: string) {
    if (!window.confirm("Diese Datei wirklich unwiderruflich löschen?")) return;
    setDeletingId(documentId);
    try {
      await fetch(`/api/personnel-files/${file.employeeId}/documents/${documentId}`, { method: "DELETE" });
      await onChanged();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mt-6 border-t border-navy-900/8 pt-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-navy-700/60">
        Dokumente (z. B. Arbeitsvertrag, Ausweiskopie)
      </div>

      <div className="mt-3 space-y-2">
        {file.documents.length === 0 ? (
          <p className="text-sm text-navy-700/50">Noch keine Dokumente hochgeladen.</p>
        ) : (
          file.documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-navy-900/8 bg-mist-50 px-3 py-2"
            >
              <a
                href={`/api/personnel-files/${file.employeeId}/documents/${doc.id}`}
                className="min-w-0 truncate text-sm font-medium text-navy-800 hover:text-amber-600"
              >
                {doc.fileName}
              </a>
              <div className="flex shrink-0 items-center gap-3 text-xs text-navy-700/50">
                <span>{formatBytes(doc.size)}</span>
                <span>{formatDateTime(doc.uploadedAt)}</span>
                <button
                  type="button"
                  disabled={deletingId === doc.id}
                  onClick={() => handleDelete(doc.id)}
                  className="inline-flex items-center gap-1 font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                  {deletingId === doc.id ? "Löscht…" : "Löschen"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          className="text-xs text-navy-700/70 file:mr-3 file:rounded-full file:border-0 file:bg-navy-900/5 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-navy-800 hover:file:bg-navy-900/10"
        />
        <button
          type="button"
          disabled={uploading}
          onClick={handleUpload}
          className="inline-flex items-center gap-1.5 rounded-full border border-navy-900/15 px-3.5 py-1.5 text-xs font-semibold text-navy-800 hover:bg-mist-100 disabled:opacity-50"
        >
          <UploadIcon className="h-3.5 w-3.5" />
          {uploading ? "Lädt hoch…" : "Hochladen"}
        </button>
      </div>
      {uploadError ? <p className="mt-2 text-sm text-red-600">{uploadError}</p> : null}
    </div>
  );
}
