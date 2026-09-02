"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/primitives";
import { CheckIcon } from "@/components/ui/icons";

const cargoTypes = [
  "Palettenware (Stückgut)",
  "Komplettladung (LKW)",
  "Teilladung",
  "Kühl-/Temperaturgut",
  "Gefahrgut (ADR)",
  "Sonstiges",
];

export function OrderForm() {
  const [submitted, setSubmitted] = useState(false);
  const [reference, setReference] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReference(`BF-${Math.floor(100000 + Math.random() * 900000)}`);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8">
        <CheckIcon className="h-6 w-6 text-emerald-600" />
        <div>
          <div className="text-lg font-semibold text-navy-900">Auftrag erfolgreich übermittelt!</div>
          <p className="mt-1 text-sm text-navy-700/75">
            Ihre Referenznummer lautet <span className="font-mono font-semibold text-navy-900">{reference}</span>.
            Unsere Disposition prüft Ihre Angaben und meldet sich zeitnah mit einem Angebot bzw. der Auftragsbestätigung.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 rounded-2xl border border-navy-900/8 bg-white p-6 shadow-sm shadow-navy-950/5 sm:p-8">
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold uppercase tracking-wide text-amber-600">Ihre Kontaktdaten</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Firma" name="company" required />
          <Field label="Ansprechpartner" name="contact" required />
          <Field label="E-Mail" name="email" type="email" required />
          <Field label="Telefon" name="phone" type="tel" required />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold uppercase tracking-wide text-amber-600">Abholung &amp; Zustellung</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Abholadresse (PLZ, Ort)" name="pickup" required />
          <Field label="Zieladresse (PLZ, Ort)" name="delivery" required />
          <Field label="Wunschtermin Abholung" name="pickupDate" type="date" required />
          <Field label="Wunschtermin Zustellung" name="deliveryDate" type="date" />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold uppercase tracking-wide text-amber-600">Angaben zur Ladung</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-800" htmlFor="cargoType">
              Art der Ladung
            </label>
            <select
              id="cargoType"
              name="cargoType"
              required
              className="w-full rounded-xl border border-navy-900/15 bg-white px-3.5 py-2.5 text-sm text-navy-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            >
              {cargoTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <Field label="Gewicht (ca. kg)" name="weight" type="number" />
          <Field label="Anzahl Paletten / Colli" name="units" type="number" />
          <Field label="Maße (L x B x H in cm)" name="dimensions" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy-800" htmlFor="notes">
            Weitere Hinweise
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            placeholder="z. B. Ladehilfsmittel, Zugangsbeschränkungen, besondere Anforderungen"
            className="w-full rounded-xl border border-navy-900/15 bg-white px-3.5 py-2.5 text-sm text-navy-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
      </fieldset>

      <div className="flex flex-col gap-3 border-t border-navy-900/8 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-navy-700/60">
          Mit dem Absenden akzeptieren Sie, dass wir Ihre Angaben zur Bearbeitung des Auftrags verwenden dürfen.
        </p>
        <Button type="submit" icon={false} className="shrink-0">
          Auftrag verbindlich einreichen
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
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
        className="w-full rounded-xl border border-navy-900/15 bg-white px-3.5 py-2.5 text-sm text-navy-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
      />
    </div>
  );
}
