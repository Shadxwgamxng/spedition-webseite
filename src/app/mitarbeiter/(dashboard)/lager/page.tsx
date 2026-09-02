"use client";

import { useMemo, useState } from "react";
import { EmployeePageHeader, StatCard } from "@/components/employee/page-header";
import { Badge, Button } from "@/components/ui/primitives";
import { CheckIcon } from "@/components/ui/icons";

type StockItem = {
  sku: string;
  name: string;
  location: string;
  stock: number;
  minStock: number;
  unit: string;
};

const initialStock: StockItem[] = [
  { sku: "PAL-EUR-001", name: "Europaletten (Tausch)", location: "Halle A / Regal 3", stock: 640, minStock: 300, unit: "Stk." },
  { sku: "VER-FOL-010", name: "Stretchfolie 500mm", location: "Halle A / Regal 7", stock: 42, minStock: 50, unit: "Rollen" },
  { sku: "LAB-VER-004", name: "Versandetiketten Thermodirekt", location: "Büro Lager", stock: 18, minStock: 25, unit: "Rollen" },
  { sku: "GUR-ZUR-002", name: "Zurrgurte 5t", location: "Halle B / Regal 1", stock: 96, minStock: 40, unit: "Stk." },
  { sku: "KAR-BOX-020", name: "Kartons 600x400x400", location: "Halle A / Regal 2", stock: 1250, minStock: 500, unit: "Stk." },
  { sku: "PAL-HOL-003", name: "Einwegpaletten", location: "Halle C / Außenlager", stock: 88, minStock: 100, unit: "Stk." },
  { sku: "SCH-FOL-012", name: "Schrumpfhauben XL", location: "Halle B / Regal 4", stock: 60, minStock: 60, unit: "Stk." },
];

export default function LagerPage() {
  const [stock, setStock] = useState<StockItem[]>(initialStock);
  const [inventoryMode, setInventoryMode] = useState(false);
  const [draft, setDraft] = useState<Record<string, number>>({});
  const [lastInventory, setLastInventory] = useState("14.08.2026");

  const lowStockCount = useMemo(() => stock.filter((i) => i.stock < i.minStock).length, [stock]);

  function startInventory() {
    const initial: Record<string, number> = {};
    stock.forEach((item) => (initial[item.sku] = item.stock));
    setDraft(initial);
    setInventoryMode(true);
  }

  function finishInventory() {
    setStock((prev) => prev.map((item) => ({ ...item, stock: draft[item.sku] ?? item.stock })));
    setInventoryMode(false);
    setLastInventory(new Date().toLocaleDateString("de-DE"));
  }

  return (
    <div>
      <EmployeePageHeader
        title="Lagerverwaltung & Inventuren"
        description="Bestände im Logistikzentrum Falkenwalde verwalten und digitale Inventuren durchführen."
        action={
          inventoryMode ? (
            <Button icon={false} onClick={finishInventory}>
              Inventur abschließen
            </Button>
          ) : (
            <Button icon={false} variant="outline" onClick={startInventory}>
              Inventur starten
            </Button>
          )
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Artikel im Bestand" value={String(stock.length)} />
        <StatCard label="Unter Mindestbestand" value={String(lowStockCount)} tone={lowStockCount ? "warn" : "good"} />
        <StatCard label="Letzte Inventur" value={lastInventory} />
        <StatCard label="Lagerfläche" value="12.000 m²" hint="Halle A–C" />
      </div>

      {inventoryMode ? (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-navy-800">
          <CheckIcon className="h-4 w-4 shrink-0 text-amber-600" />
          Inventurmodus aktiv – bitte die gezählten Mengen je Artikel eintragen und anschließend abschließen.
        </div>
      ) : null}

      <div className="mt-4 overflow-x-auto rounded-2xl border border-navy-900/8 bg-white shadow-sm shadow-navy-950/5">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-navy-900/8 bg-mist-100 text-xs uppercase tracking-wide text-navy-700/60">
            <tr>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Artikel</th>
              <th className="px-4 py-3 font-medium">Lagerort</th>
              <th className="px-4 py-3 font-medium">Mindestbestand</th>
              <th className="px-4 py-3 font-medium">{inventoryMode ? "Gezählter Bestand" : "Bestand"}</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-900/6">
            {stock.map((item) => {
              const current = inventoryMode ? draft[item.sku] ?? item.stock : item.stock;
              const low = current < item.minStock;
              return (
                <tr key={item.sku}>
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
                        value={draft[item.sku] ?? item.stock}
                        onChange={(e) =>
                          setDraft((prev) => ({ ...prev, [item.sku]: Number(e.target.value) }))
                        }
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
