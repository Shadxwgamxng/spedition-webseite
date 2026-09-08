"use client";

import { useState, type FormEvent } from "react";
import type { OrderRecord } from "@/lib/fleet-data";
import { MessageIcon } from "@/components/ui/icons";

export function OrderChat({
  order,
  from,
  authorName,
  onSent,
}: {
  order: OrderRecord;
  from: "driver" | "dispo";
  authorName: string;
  onSent: () => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await fetch(`/api/orders/${order.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, authorName, text: text.trim() }),
      });
      setText("");
      await onSent();
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-xl border border-navy-900/8 bg-mist-100 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-navy-700/60">
        <MessageIcon className="h-4 w-4" />
        Nachrichten zu {order.id}
      </div>
      <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
        {order.messages.length === 0 ? (
          <p className="text-xs text-navy-700/50">Noch keine Nachrichten.</p>
        ) : (
          order.messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                m.from === from ? "ml-auto bg-amber-400 text-navy-950" : "bg-white text-navy-800"
              }`}
            >
              <div className="text-[11px] font-semibold opacity-70">{m.authorName}</div>
              <div>{m.text}</div>
              <div className="mt-0.5 text-[10px] opacity-60">
                {new Date(m.at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr
              </div>
            </div>
          ))
        )}
      </div>
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nachricht schreiben…"
          className="flex-1 rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-50"
        >
          Senden
        </button>
      </form>
    </div>
  );
}
