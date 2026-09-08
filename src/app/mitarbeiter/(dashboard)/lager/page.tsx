"use client";

import { useMemo, useState, type FormEvent } from "react";
import { EmployeePageHeader, StatCard } from "@/components/employee/page-header";
import { Badge, Button } from "@/components/ui/primitives";
import { CheckIcon } from "@/components/ui/icons";
import { usePolling } from "@/lib/use-polling";

type StockItem = {
  id: string;
  sku: string;
  name: string;
  location: string;
  stock: number;
  minStock: number;
  unit: string;
};

export default function LagerPage() {
  const { data, refetch } = usePolling<{ items: StockItem[]; lastInventoryAt: string | null }>("/api/stock", 5000);
  const stock = useMemo(() => data?.items ?? [], [data]);

  const [inventoryMode, setInventoryMode] = useState(false);
  const [draft, setDraft] = useState<Record<string, number>>({});
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const lowStockCount = useMemo(() => stock.filter((i) => i.stock < i.minStock).length, [stock]);

  function startInventory() {
    const initial: Record<string, number> = {};
    stock.forEach((item) => (initial[item.id] = item.stock));
    setDraft(initial);
    setInventoryMode(true);
  }

  async function finishInventory() {
    setSaving(true);
    try {
      await fetch("/api/stock/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ counts: draft }),
      });
      await refetch();
      setInventoryMode(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const payload = {
      sku: String(form.get("sku") ?? ""),
      name: String(form.get("name") ?? ""),
      location: String(form.get("location") ?? ""),
      unit: String(form.get("unit") ?? ""),
      stock: Number(form.get("stock") ?? 0),
      minStock: Number(form.get("minStock") ?? 0),
    };
    const res = await fetch("/api/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      setError(json.error ?? "Artikel konnte nicht angelegt werden.");
      return;
    }
    await refetch();
    setShowForm(false);
    event.currentTarget.reset();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/stock/${id}`, { method: "DELETE" });
    await refetch();
  }

  return (
    <div>
      <EmployeePageHeader
        title="Lagerverwaltung & Inventuren"
        description="Bestände im Logistikzentrum verwalten und digitale Inventuren durchführen."
        action={
          inventoryMode ? (
            <Button icon={false} onClick={finishInventory} disabled={saving}>
              {saving ? "Speichert…" : "Inventur abschließen"}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button icon={false} variant="outline" onClick={() => setShowForm((v) => !v)}>
                {showForm ? "Formular schließen" : "Artikel anlegen"}
              </Button>
              {stock.length > 0 ? (
                <Button icon={false} variant="outline" onClick={startInventory}>
                  Inventur starten
                </Button>
              ) : null}
            </div>
          )
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Artikel im Bestand" value={String(stock.length)} />
        <StatCard label="Unter Mindestbestand" value={String(lowStockCount)} tone={lowStockCount ? "warn" : "good"} />
        <StatCard
          label="Letzte Inventur"
          value={data?.lastInventoryAt ? new Date(data.lastInventoryAt).toLocaleDateString("de-DE") : "Noch keine"}
        />
      </div>

      {showForm ? (
        <form
          onSubmit={handleCreate}
          className="mt-6 grid grid-cols-1 gap-3 rounded-2xl border border-navy-900/8 bg-white p-6 shadow-sm shadow-navy-950/5 sm:grid-cols-2 lg:grid-cols-3"
        >
          <FormField label="SKU" name="sku" required />
          <FormField label="Artikelname" name="name" required />
          <FormField label="Lagerort" name="location" placeholder="z. B. Halle A / Regal 3" required />
          <FormField label="Einheit" name="unit" placeholder="z. B. Stk., Rollen" required />
          <FormField label="Anfangsbestand" name="stock" type="number" required />
          <FormField label="Mindestbestand" name="minStock" type="number" required />
          {error ? <p className="text-sm text-red-600 sm:col-span-2 lg:col-span-3">{error}</p> : null}
          <div className="sm:col-span-2 lg:col-span-3">
            <Button type="submit" icon={false}>
              Artikel speichern
            </Button>
          </div>
        </form>
      ) : null}

      {inventoryMode ? (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-navy-800">
          <CheckIcon className="h-4 w-4 shrink-0 text-amber-600" />
          Inventurmodus aktiv – bitte die gezählten Mengen je Artikel eintragen und anschließend abschließen.
        </div>
      ) : null}

      <div className="mt-4 overflow-x-auto rounded-2xl border border-navy-900/8 bg-white shadow-sm shadow-navy-950/5">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-navy-900/8 bg-mist-100 text-xs uppercase tracking-wide text-navy-700/60">
            <tr>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Artikel</th>
              <th className="px-4 py-3 font-medium">Lagerort</th>
              <th className="px-4 py-3 font-medium">Mindestbestand</th>
              <th className="px-4 py-3 font-medium">{inventoryMode ? "Gezählter Bestand" : "Bestand"}</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">&nbsp;</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-900/6">
            {stock.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-navy-700/60">
                  Noch keine Artikel angelegt.
                </td>
              </tr>
            ) : (
              stock.map((item) => {
                const current = inventoryMode ? draft[item.id] ?? item.stock : item.stock;
                const low = current < item.minStock;
                return (
                  <tr key={item.id}>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-navy-700/70">{item.sku}</td>
                    <td className="px-4 py-3 font-medium text-navy-900">{item.name}</td>
                    <td className="px-4 py-3 text-navy-700/70">{item.location}</td>
                    <td className="px-4 py-3 text-navy-700/70">
                      {item.minStock} {item.unit}
                    </td>
                    <td className="px-4 py-3">
                      {inventoryMode ? (
                        <input
                          type="number"
                          min={0}
                          value={draft[item.id] ?? item.stock}
                          onChange={(e) => setDraft((prev) => ({ ...prev, [item.id]: Number(e.target.value) }))}
                          className="w-24 rounded-lg border border-navy-900/15 bg-white px-2 py-1.5 text-sm"
                        />
                      ) : (
                        <span className="font-medium text-navy-900">
                          {item.stock} {item.unit}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={low ? "amber" : "green"}>{low ? "Nachbestellen" : "Ausreichend"}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {!inventoryMode ? (
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="text-xs font-semibold text-red-600 hover:text-red-700"
                        >
                          Löschen
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FormField({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
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
        placeholder={placeholder}
        className="w-full rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm text-navy-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
      />
    </div>
  );
}
