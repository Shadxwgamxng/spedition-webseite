"use client";

import { useState, type FormEvent } from "react";
import { usePolling } from "@/lib/use-polling";
import { Button } from "@/components/ui/primitives";
import { CheckIcon } from "@/components/ui/icons";

export type FieldConfig = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "number" | "date" | "select" | "list";
  options?: string[];
  required?: boolean;
  placeholder?: string;
  /** For type "list": join/split the array with this separator's lines. Default: one item per line. */
  help?: string;
};

type Item = Record<string, unknown>;

const NEW = "__new__";

export function CollectionManager({
  collection,
  idField,
  fields,
  titleField,
  subtitleField,
  emptyLabel,
  newLabel,
}: {
  collection: string;
  idField: string;
  fields: FieldConfig[];
  titleField: string;
  subtitleField?: string;
  emptyLabel: string;
  newLabel: string;
}) {
  const { data, refetch } = usePolling<{ items: Item[] }>(`/api/admin/${collection}`, 6000);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const items = data?.items ?? [];
  const editingItem = editingId && editingId !== NEW ? items.find((i) => String(i[idField]) === editingId) : null;

  function fieldDefaultValue(field: FieldConfig): string {
    const value = editingItem?.[field.key];
    if (value == null) return field.type === "select" ? field.options?.[0] ?? "" : "";
    if (field.type === "list" && Array.isArray(value)) return value.join("\n");
    return String(value);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = {};
    for (const field of fields) {
      const raw = form.get(field.key);
      if (field.type === "number") {
        payload[field.key] = Number(raw ?? 0);
      } else if (field.type === "list") {
        payload[field.key] = String(raw ?? "")
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
      } else {
        payload[field.key] = String(raw ?? "");
      }
    }

    try {
      const isNew = editingId === NEW;
      const res = await fetch(isNew ? `/api/admin/${collection}` : `/api/admin/${collection}/${editingId}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) {
        setError(json.error ?? "Speichern fehlgeschlagen.");
        return;
      }
      await refetch();
      setEditingId(null);
    } catch {
      setError("Verbindung zum Server fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/admin/${collection}/${id}`, { method: "DELETE" });
      await refetch();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="text-sm text-navy-700/60">{items.length} Einträge</div>
        <Button icon={false} onClick={() => setEditingId(editingId ? null : NEW)}>
          {editingId ? "Formular schließen" : newLabel}
        </Button>
      </div>

      {editingId ? (
        <form
          onSubmit={handleSubmit}
          className="mt-4 grid grid-cols-1 gap-3 rounded-2xl border border-navy-900/8 bg-white p-5 shadow-sm shadow-navy-950/5 sm:grid-cols-2"
        >
          {fields.map((field) => (
            <div key={field.key} className={field.type === "textarea" || field.type === "list" ? "sm:col-span-2" : ""}>
              <label className="mb-1.5 block text-xs font-medium text-navy-800" htmlFor={field.key}>
                {field.label}
                {field.help ? <span className="ml-1 font-normal text-navy-700/50">({field.help})</span> : null}
              </label>
              {field.type === "textarea" || field.type === "list" ? (
                <textarea
                  id={field.key}
                  name={field.key}
                  required={field.required}
                  rows={field.type === "list" ? 4 : 3}
                  defaultValue={fieldDefaultValue(field)}
                  placeholder={field.placeholder}
                  className="w-full rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              ) : field.type === "select" ? (
                <select
                  id={field.key}
                  name={field.key}
                  defaultValue={fieldDefaultValue(field)}
                  className="w-full rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                >
                  {field.options?.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={field.key}
                  name={field.key}
                  type={field.type}
                  required={field.required}
                  defaultValue={fieldDefaultValue(field)}
                  placeholder={field.placeholder}
                  className="w-full rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              )}
            </div>
          ))}
          {error ? <p className="text-sm text-red-600 sm:col-span-2">{error}</p> : null}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-navy-950 hover:bg-amber-400 disabled:opacity-60"
            >
              <CheckIcon className="h-4 w-4" />
              {saving ? "Speichert…" : "Speichern"}
            </button>
          </div>
        </form>
      ) : null}

      <div className="mt-4 space-y-2">
        {items.length === 0 ? (
          <p className="rounded-2xl border border-navy-900/8 bg-white p-6 text-sm text-navy-700/60">{emptyLabel}</p>
        ) : (
          items.map((item) => {
            const id = String(item[idField]);
            return (
              <div
                key={id}
                className="flex items-center justify-between gap-4 rounded-xl border border-navy-900/8 bg-white px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-navy-900">{String(item[titleField] ?? id)}</div>
                  {subtitleField ? (
                    <div className="truncate text-xs text-navy-700/60">{String(item[subtitleField] ?? "")}</div>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingId(id)}
                    className="text-xs font-semibold text-navy-700 hover:text-navy-900"
                  >
                    Bearbeiten
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === id}
                    onClick={() => handleDelete(id)}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    {deletingId === id ? "Löscht…" : "Löschen"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
