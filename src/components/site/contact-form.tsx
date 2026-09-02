"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/primitives";
import { CheckIcon } from "@/components/ui/icons";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6">
        <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <div>
          <div className="font-semibold text-navy-900">Vielen Dank für Ihre Nachricht!</div>
          <p className="mt-1 text-sm text-navy-700/75">
            Wir haben Ihre Anfrage erhalten und melden uns schnellstmöglich bei Ihnen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-navy-900/8 bg-white p-6 shadow-sm shadow-navy-950/5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Name" name="name" required />
        <Field label="Unternehmen" name="company" />
        <Field label="E-Mail" name="email" type="email" required />
        <Field label="Telefon" name="phone" type="tel" />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-navy-800" htmlFor="message">
          Nachricht
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className="w-full rounded-xl border border-navy-900/15 bg-white px-3.5 py-2.5 text-sm text-navy-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
        />
      </div>
      <Button type="submit" icon={false}>
        Nachricht senden
      </Button>
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
