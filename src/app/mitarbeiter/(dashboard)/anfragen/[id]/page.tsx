"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { EmployeePageHeader } from "@/components/employee/page-header";
import { useAuth } from "@/lib/auth";
import { usePolling } from "@/lib/use-polling";
import type { ContactInquiryRecord } from "@/lib/server/db-types";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AnfrageDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data, refetch } = usePolling<{ inquiry: ContactInquiryRecord }>(`/api/contact/${params.id}`, 8000);
  const inquiry = data?.inquiry ?? null;
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendReply() {
    if (!text.trim()) return;
    setSending(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/contact/${params.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, sentBy: user?.name ?? "" }),
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) {
        setError(json.error ?? "Nachricht konnte nicht gesendet werden.");
        return;
      }
      setNotice(
        json.discordDm?.ok
          ? "Nachricht wurde per Discord-DM verschickt."
          : `Antwort gespeichert, aber die Discord-DM konnte nicht verschickt werden: ${json.discordDm?.error ?? "unbekannter Fehler"}`,
      );
      setText("");
      await refetch();
    } finally {
      setSending(false);
    }
  }

  if (!inquiry) {
    return <p className="text-sm text-navy-700/60">Anfrage wird geladen…</p>;
  }

  return (
    <div>
      <EmployeePageHeader title={inquiry.name} description={inquiry.company || "Kontaktanfrage von der Website"} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-navy-900/8 bg-white p-6 shadow-sm shadow-navy-950/5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-600">Nachricht</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm text-navy-800">{inquiry.message || "—"}</p>
            <p className="mt-3 text-xs text-navy-700/50">Eingegangen am {formatDateTime(inquiry.createdAt)}</p>
          </div>

          <div className="rounded-2xl border border-navy-900/8 bg-white p-6 shadow-sm shadow-navy-950/5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-600">Antwort per Discord-DM</h2>
            <p className="mt-1.5 text-xs text-navy-700/50">
              Der Text wird 1:1 als Discord-DM an die Person verschickt (mit kurzer Begrüßung/Absender drumherum).
            </p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              placeholder="Ihre Antwort…"
              className="mt-3 w-full rounded-lg border border-navy-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
            {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
            {notice ? <p className="mt-2 text-sm text-navy-700">{notice}</p> : null}
            <button
              type="button"
              disabled={sending || !text.trim()}
              onClick={sendReply}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-navy-950 hover:bg-amber-400 disabled:opacity-50"
            >
              {sending ? "Wird gesendet…" : "Nachricht senden"}
            </button>
          </div>

          {inquiry.replies.length > 0 ? (
            <div className="rounded-2xl border border-navy-900/8 bg-white p-6 shadow-sm shadow-navy-950/5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-600">Bisherige Antworten</h2>
              <ul className="mt-3 space-y-3">
                {inquiry.replies
                  .slice()
                  .reverse()
                  .map((reply) => (
                    <li key={reply.id} className="rounded-lg border border-navy-900/8 bg-mist-50 p-3">
                      <p className="whitespace-pre-wrap text-sm text-navy-800">{reply.text}</p>
                      <p className="mt-1.5 text-xs text-navy-700/50">
                        {reply.sentBy} · {formatDateTime(reply.sentAt)}
                      </p>
                    </li>
                  ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-navy-900/8 bg-white p-6 shadow-sm shadow-navy-950/5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-600">Kontakt</h2>
            <dl className="mt-3 space-y-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-navy-700/60">E-Mail</dt>
                <dd className="text-right text-navy-900">
                  <a href={`mailto:${inquiry.email}`} className="hover:text-amber-600">
                    {inquiry.email}
                  </a>
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-navy-700/60">Telefon</dt>
                <dd className="text-right text-navy-900">{inquiry.phone || "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-navy-700/60">Unternehmen</dt>
                <dd className="text-right text-navy-900">{inquiry.company || "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-navy-700/60">Discord-ID</dt>
                <dd className="text-right font-mono text-xs text-navy-900">{inquiry.discordId}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
