"use client";

import { useState, type FormEvent } from "react";
import { EmployeePageHeader } from "@/components/employee/page-header";
import { Badge, Button } from "@/components/ui/primitives";
import { CheckIcon } from "@/components/ui/icons";
import { usePolling } from "@/lib/use-polling";
import type { CustomerRecord } from "@/lib/server/db-types";

const NEW = "__new__";

export default function KundenstammbaumPage() {
  const { data, refetch } = usePolling<{ customers: CustomerRecord[] }>("/api/customers", 8000);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const customers = data?.customers ?? [];
  const editingCustomer = editingId && editingId !== NEW ? customers.find((c) => c.id === editingId) : null;
  const isNew = editingId === NEW;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const payload: Record<string, string | boolean> = {
      companyName: String(form.get("companyName") ?? ""),
      contactName: String(form.get("contactName") ?? ""),
      street: String(form.get("street") ?? ""),
      zip: String(form.get("zip") ?? ""),
      city: String(form.get("city") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      notes: String(form.get("notes") ?? ""),
      discordId: String(form.get("discordId") ?? ""),
      portalEnabled: form.get("portalEnabled") === "on",
    };

    try {
      const res = await fetch(isNew ? "/api/customers" : `/api/customers/${editingId}`, {
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
    if (!window.confirm("Diesen Kunden wirklich unwiderruflich löschen?")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/customers/${id}`, { method: "DELETE" });
      await refetch();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <EmployeePageHeader
        title="Kundenstammbaum"
        description="Kundendaten zentral pflegen — in Rechnungen genügt danach die Auswahl des Kunden."
        action={
          <Button icon={false} onClick={() => setEditingId(editingId ? null : NEW)}>
            {editingId ? "Formular schließen" : "Kunde anlegen"}
          </Button>
        }
      />

      {editingId ? (
        <form
          onSubmit={handleSubmit}
          className="mb-6 grid grid-cols-1 gap-3 rounded-2xl border border-navy-900/8 bg-white p-5 shadow-sm shadow-navy-950/5 sm:grid-cols-2 lg:grid-cols-3"
        >
          <Field label="Firmenname" name="companyName" required defaultValue={editingCustomer?.companyName} />
          <Field label="Ansprechpartner" name="contactName" defaultValue={editingCustomer?.contactName} />
          <Field label="Straße & Hausnummer" name="street" defaultValue={editingCustomer?.street} />
          <Field label="PLZ" name="zip" defaultValue={editingCustomer?.zip} />
          <Field label="Ort" name="city" defaultValue={editingCustomer?.city} />
          <Field label="E-Mail" name="email" type="email" defaultValue={editingCustomer?.email} />
          <Field label="Telefon" name="phone" defaultValue={editingCustomer?.phone} />
          <Field
            label="Discord-Nutzer-ID"
            name="discordId"
            placeholder="z. B. 123456789012345678"
            defaultValue={editingCustomer?.discordId}
          />
          <div className="flex items-end pb-2 sm:col-span-2 lg:col-span-1">
            <label className="flex items-center gap-2 text-sm text-navy-800">
              <input
                type="checkbox"
                name="portalEnabled"
                defaultChecked={editingCustomer?.portalEnabled ?? false}
                className="h-4 w-4 rounded border-navy-900/25 text-amber-500 focus:ring-amber-500/40"
              />
              Freischalten für Internes Dispositionssystem
            </label>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="mb-1.5 block text-xs font-medium text-navy-800" htmlFor="notes">
              Notizen
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={editingCustomer?.notes}
              className="w-full rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
          <p className="text-xs text-navy-700/50 sm:col-span-2 lg:col-span-3">
            Mit freigeschaltetem Dispositionssystem und hinterlegter Discord-Nutzer-ID kann sich dieser Kunde unter{" "}
            <span className="font-mono">/kunden/login</span> mit Discord anmelden, um Aufträge direkt einzureichen
            und seine eigenen Aufträge einzusehen.
          </p>

          {error ? <p className="text-sm text-red-600 sm:col-span-2 lg:col-span-3">{error}</p> : null}
          <div className="sm:col-span-2 lg:col-span-3">
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

      <div className="overflow-x-auto rounded-2xl border border-navy-900/8 bg-white shadow-sm shadow-navy-950/5">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-navy-900/8 bg-mist-100 text-xs uppercase tracking-wide text-navy-700/60">
            <tr>
              <th className="px-4 py-3 font-medium">Kundennummer</th>
              <th className="px-4 py-3 font-medium">Firma</th>
              <th className="px-4 py-3 font-medium">Ansprechpartner</th>
              <th className="px-4 py-3 font-medium">Ort</th>
              <th className="px-4 py-3 font-medium">Kontakt</th>
              <th className="px-4 py-3 font-medium">Dispositionssystem</th>
              <th className="px-4 py-3 font-medium">&nbsp;</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-900/6">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-navy-700/60">
                  Noch keine Kunden angelegt.
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id}>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-navy-700/70">
                    {customer.customerNumber}
                  </td>
                  <td className="px-4 py-3 font-medium text-navy-900">{customer.companyName}</td>
                  <td className="px-4 py-3 text-navy-700/80">{customer.contactName || "—"}</td>
                  <td className="px-4 py-3 text-navy-700/80">
                    {[customer.zip, customer.city].filter(Boolean).join(" ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-navy-700/70">
                    {[customer.email, customer.phone].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={customer.portalEnabled ? "green" : "navy"}>
                      {customer.portalEnabled ? "Freigeschaltet" : "Deaktiviert"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingId(customer.id)}
                        className="text-xs font-semibold text-navy-700 hover:text-navy-900"
                      >
                        Bearbeiten
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === customer.id}
                        onClick={() => handleDelete(customer.id)}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        {deletingId === customer.id ? "Löscht…" : "Löschen"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
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
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
      />
    </div>
  );
}
