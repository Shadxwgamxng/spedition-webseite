"use client";

import { useRef, useState, type FormEvent } from "react";
import { usePolling } from "@/lib/use-polling";
import { CheckIcon, FolderIcon, InvoiceIcon, LockIcon, MessageIcon, TrashIcon, UploadIcon } from "@/components/ui/icons";
import { useAuth, type EmployeeUser } from "@/lib/auth";
import { parseJsonResponse } from "@/lib/parse-json-response";

type Employee = EmployeeUser & { id: string };
type PersonnelDocument = { id: string; fileName: string; mimeType: string; size: number; uploadedAt: string };
type PersonnelWarning = { id: string; date: string; reason: string; issuedBy: string; createdAt: string; documentId: string | null };
type PersonnelTermination = {
  id: string;
  date: string;
  effectiveDate: string;
  terminationType: "ordentlich" | "fristlos";
  reason: string;
  issuedBy: string;
  createdAt: string;
  documentId: string | null;
};
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
  healthInsurance: string;
  iban: string;
  notes: string;
  contractGeneratedAt: string | null;
  documents: PersonnelDocument[];
  warnings: PersonnelWarning[];
  terminations: PersonnelTermination[];
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatDateOnly(value: string): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function PersonnelFilesManager() {
  const { user } = useAuth();
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
                    <PersonnelDisciplinary file={file} issuedBy={user?.name ?? ""} issuedByRole={user?.role ?? ""} onChanged={refetchAll} />
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
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setNotice(null);
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
      if (json.contract?.generated) {
        setNotice(
          json.contract.discordDm?.ok
            ? "Akte vollständig — Arbeitsvertrag wurde erstellt, in der Akte abgelegt und per Discord-DM verschickt."
            : `Akte vollständig — Arbeitsvertrag wurde erstellt und in der Akte abgelegt, aber die Discord-DM konnte nicht verschickt werden: ${json.contract.discordDm?.error ?? "unbekannter Fehler"}`,
        );
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
      <div className="flex flex-col gap-2.5 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between lg:col-span-3">
        {file.contractGeneratedAt ? (
          <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-700">
            Arbeitsvertrag wurde am {formatDateTime(file.contractGeneratedAt)} zuletzt erstellt (siehe Dokumente
            unten).
          </p>
        ) : (
          <p className="text-xs text-navy-700/50">
            Sobald alle Felder unten ausgefüllt sind, wird beim Speichern automatisch ein Arbeitsvertrag erstellt, in
            der Akte abgelegt und per Discord an die Person verschickt.
          </p>
        )}
        <RegenerateContractButton file={file} onSaved={onSaved} />
      </div>
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
      <Field label="Krankenkasse" name="healthInsurance" defaultValue={file.healthInsurance} />
      <Field label="IBAN" name="iban" defaultValue={file.iban} />
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
      {notice ? <p className="text-sm text-navy-700 sm:col-span-2 lg:col-span-3">{notice}</p> : null}
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

function RegenerateContractButton({ file, onSaved }: { file: PersonnelFile; onSaved: () => Promise<void> }) {
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleClick() {
    if (
      !window.confirm(
        "Neuen Arbeitsvertrag mit den aktuellen Daten (z. B. nach einer Beförderung) erstellen? Er wird zusätzlich in der Akte abgelegt.",
      )
    ) {
      return;
    }
    setError(null);
    setNotice(null);
    setRegenerating(true);
    try {
      const res = await fetch(`/api/personnel-files/${file.employeeId}/contract`, { method: "POST" });
      const json = (await parseJsonResponse(res)) as {
        ok: boolean;
        error?: string;
        contract?: { discordDm?: { ok: boolean; error?: string } };
      };
      if (!res.ok || json.ok === false) {
        setError(json.error ?? "Arbeitsvertrag konnte nicht erstellt werden.");
        return;
      }
      setNotice(
        json.contract?.discordDm?.ok
          ? "Neuer Arbeitsvertrag wurde erstellt, in der Akte abgelegt und per Discord-DM verschickt."
          : `Neuer Arbeitsvertrag wurde erstellt und in der Akte abgelegt, aber die Discord-DM konnte nicht verschickt werden: ${json.contract?.discordDm?.error ?? "unbekannter Fehler"}`,
      );
      await onSaved();
    } catch {
      setError("Verbindung zum Server fehlgeschlagen.");
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="shrink-0 text-right">
      <button
        type="button"
        disabled={regenerating}
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 rounded-full border border-navy-900/15 px-3.5 py-1.5 text-xs font-semibold text-navy-800 hover:bg-mist-100 disabled:opacity-50"
      >
        <InvoiceIcon className="h-3.5 w-3.5" />
        {regenerating ? "Erstellt…" : "Arbeitsvertrag neu erstellen"}
      </button>
      {error ? <p className="mt-1.5 text-xs text-red-600">{error}</p> : null}
      {notice ? <p className="mt-1.5 text-xs text-navy-700">{notice}</p> : null}
    </div>
  );
}

function WarningDialog({
  onConfirm,
  onCancel,
  saving,
}: {
  onConfirm: (input: { date: string; reason: string }) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4" onClick={onCancel}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-navy-900">Abmahnung erstellen</h3>
        <p className="mt-1.5 text-xs text-navy-700/60">
          Erzeugt ein PDF-Schreiben, legt es in der Akte ab und verschickt es per Discord-DM, falls ein Account
          verknüpft ist.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-navy-800" htmlFor="warning-date">
              Datum
            </label>
            <input
              id="warning-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-navy-800" htmlFor="warning-reason">
              Grund
            </label>
            <textarea
              id="warning-reason"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Was ist vorgefallen?"
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
            disabled={!date || !reason.trim() || saving}
            onClick={() => onConfirm({ date, reason: reason.trim() })}
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-navy-950 hover:bg-amber-400 disabled:opacity-50"
          >
            <MessageIcon className="h-3.5 w-3.5" />
            {saving ? "Erstellt…" : "Abmahnung erstellen"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TerminationDialog({
  onConfirm,
  onCancel,
  saving,
}: {
  onConfirm: (input: { date: string; effectiveDate: string; terminationType: "ordentlich" | "fristlos"; reason: string }) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [effectiveDate, setEffectiveDate] = useState(today);
  const [terminationType, setTerminationType] = useState<"ordentlich" | "fristlos">("ordentlich");
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4" onClick={onCancel}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-navy-900">Kündigung erstellen</h3>
        <p className="mt-1.5 text-xs text-navy-700/60">
          Erzeugt ein PDF-Schreiben, legt es in der Akte ab und verschickt es per Discord-DM, falls ein Account
          verknüpft ist.
        </p>

        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-navy-800" htmlFor="termination-date">
                Datum
              </label>
              <input
                id="termination-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-navy-800" htmlFor="termination-effective">
                Wirksam zum
              </label>
              <input
                id="termination-effective"
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="w-full rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-navy-800" htmlFor="termination-type">
              Art
            </label>
            <select
              id="termination-type"
              value={terminationType}
              onChange={(e) => setTerminationType(e.target.value === "fristlos" ? "fristlos" : "ordentlich")}
              className="w-full rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="ordentlich">Ordentlich (mit Frist)</option>
              <option value="fristlos">Außerordentlich / fristlos</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-navy-800" htmlFor="termination-reason">
              Grund
            </label>
            <textarea
              id="termination-reason"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Warum wird das Arbeitsverhältnis beendet?"
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
            disabled={!date || !effectiveDate || !reason.trim() || saving}
            onClick={() => onConfirm({ date, effectiveDate, terminationType, reason: reason.trim() })}
            className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50"
          >
            <LockIcon className="h-3.5 w-3.5" />
            {saving ? "Erstellt…" : "Kündigung erstellen"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PersonnelDisciplinary({
  file,
  issuedBy,
  issuedByRole,
  onChanged,
}: {
  file: PersonnelFile;
  issuedBy: string;
  issuedByRole: string;
  onChanged: () => Promise<void>;
}) {
  const [dialog, setDialog] = useState<"warning" | "termination" | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function describeDm(json: { [key: string]: unknown }, kindLabel: string) {
    const letter = json.letter as { discordDm?: { ok: boolean; error?: string } } | undefined;
    return letter?.discordDm?.ok
      ? `${kindLabel} wurde erstellt, in der Akte abgelegt und per Discord-DM verschickt.`
      : `${kindLabel} wurde erstellt und in der Akte abgelegt, aber die Discord-DM konnte nicht verschickt werden: ${letter?.discordDm?.error ?? "unbekannter Fehler"}`;
  }

  async function submitWarning(input: { date: string; reason: string }) {
    setError(null);
    setNotice(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/personnel-files/${file.employeeId}/warnings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, issuedBy, issuedByRole }),
      });
      const json = await parseJsonResponse(res);
      if (!res.ok || json.ok === false) {
        setError(json.error ?? "Abmahnung konnte nicht erstellt werden.");
        return;
      }
      setNotice(describeDm(json, "Abmahnung"));
      setDialog(null);
      await onChanged();
    } catch {
      setError("Verbindung zum Server fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  async function submitTermination(input: { date: string; effectiveDate: string; terminationType: "ordentlich" | "fristlos"; reason: string }) {
    setError(null);
    setNotice(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/personnel-files/${file.employeeId}/terminations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, issuedBy, issuedByRole }),
      });
      const json = await parseJsonResponse(res);
      if (!res.ok || json.ok === false) {
        setError(json.error ?? "Kündigung konnte nicht erstellt werden.");
        return;
      }
      setNotice(describeDm(json, "Kündigung"));
      setDialog(null);
      await onChanged();
    } catch {
      setError("Verbindung zum Server fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  type HistoryEntry =
    | { kind: "warning"; id: string; date: string; reason: string; issuedBy: string; documentId: string | null; extra?: string }
    | { kind: "termination"; id: string; date: string; reason: string; issuedBy: string; documentId: string | null; extra?: string };

  const history: HistoryEntry[] = [
    ...file.warnings.map((w): HistoryEntry => ({ kind: "warning", id: w.id, date: w.date, reason: w.reason, issuedBy: w.issuedBy, documentId: w.documentId })),
    ...file.terminations.map(
      (t): HistoryEntry => ({
        kind: "termination",
        id: t.id,
        date: t.date,
        reason: t.reason,
        issuedBy: t.issuedBy,
        documentId: t.documentId,
        extra: `${t.terminationType === "fristlos" ? "Fristlos" : "Ordentlich"} · wirksam zum ${formatDateOnly(t.effectiveDate)}`,
      }),
    ),
  ].sort((a, b) => b.date.localeCompare(a.date));

  async function handleDeleteEntry(entry: HistoryEntry) {
    const label = entry.kind === "termination" ? "Kündigung" : "Abmahnung";
    if (!window.confirm(`${label} wirklich unwiderruflich löschen? Das zugehörige PDF wird ebenfalls entfernt.`)) return;
    setDeletingId(entry.id);
    try {
      const path = entry.kind === "termination" ? "terminations" : "warnings";
      await fetch(`/api/personnel-files/${file.employeeId}/${path}/${entry.id}`, { method: "DELETE" });
      await onChanged();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mt-6 border-t border-navy-900/8 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-navy-700/60">
          Abmahnungen &amp; Kündigungen
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDialog("warning")}
            className="inline-flex items-center gap-1.5 rounded-full border border-navy-900/15 px-3.5 py-1.5 text-xs font-semibold text-navy-800 hover:bg-mist-100"
          >
            <MessageIcon className="h-3.5 w-3.5" />
            Abmahnung erstellen
          </button>
          <button
            type="button"
            onClick={() => setDialog("termination")}
            className="inline-flex items-center gap-1.5 rounded-full border border-red-600/30 px-3.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
          >
            <LockIcon className="h-3.5 w-3.5" />
            Kündigung erstellen
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {history.length === 0 ? (
          <p className="text-sm text-navy-700/50">Noch keine Abmahnungen oder Kündigungen.</p>
        ) : (
          history.map((entry) => (
            <div key={entry.id} className="rounded-lg border border-navy-900/8 bg-mist-50 px-3 py-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-navy-900">
                  <span className={entry.kind === "termination" ? "text-red-600" : "text-amber-600"}>
                    {entry.kind === "termination" ? "Kündigung" : "Abmahnung"}
                  </span>
                  <span className="text-navy-700/50">{formatDateOnly(entry.date)}</span>
                  {entry.extra ? <span className="text-navy-700/50">· {entry.extra}</span> : null}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {entry.documentId ? (
                    <a
                      href={`/api/personnel-files/${file.employeeId}/documents/${entry.documentId}`}
                      className="text-xs font-semibold text-navy-700 hover:text-amber-600"
                    >
                      PDF öffnen
                    </a>
                  ) : null}
                  <button
                    type="button"
                    disabled={deletingId === entry.id}
                    onClick={() => handleDeleteEntry(entry)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                    {deletingId === entry.id ? "Löscht…" : "Löschen"}
                  </button>
                </div>
              </div>
              <p className="mt-1.5 text-sm text-navy-800">{entry.reason}</p>
              <p className="mt-1 text-xs text-navy-700/50">erstellt von {entry.issuedBy || "—"}</p>
            </div>
          ))
        )}
      </div>

      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      {notice ? <p className="mt-2 text-sm text-navy-700">{notice}</p> : null}

      {dialog === "warning" ? (
        <WarningDialog saving={saving} onCancel={() => setDialog(null)} onConfirm={submitWarning} />
      ) : null}
      {dialog === "termination" ? (
        <TerminationDialog saving={saving} onCancel={() => setDialog(null)} onConfirm={submitTermination} />
      ) : null}
    </div>
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
      const json = await parseJsonResponse(res);
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
