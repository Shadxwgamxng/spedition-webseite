"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { usePolling } from "@/lib/use-polling";
import { BellIcon } from "@/components/ui/icons";

type NotificationRecord = {
  id: string;
  kind: "pool_order" | "order_assigned" | "application" | "inquiry" | "customer_order";
  message: string;
  href: string;
  createdAt: string;
  readBy: string[];
};

type NotificationsResponse = { notifications: NotificationRecord[] };

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "gerade eben";
  if (minutes < 60) return `vor ${minutes} Min.`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.round(hours / 24);
  return `vor ${days} Tag${days === 1 ? "" : "en"}`;
}

/** Kurzer, synthetischer Signalton via Web Audio API — kein Audio-Asset
 * nötig, funktioniert überall sofort mit. */
function playNotificationSound() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.setValueAtTime(1175, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.35);
    oscillator.onended = () => ctx.close();
  } catch {
    // Web Audio nicht verfügbar (z. B. sehr alter Browser) — Ton ist ein
    // Extra, kein Grund, die restliche Glocke scheitern zu lassen.
  }
}

/**
 * Glocke oben rechts im Mitarbeiter-Dashboard (siehe DashboardShell). Pollt
 * /api/notifications (session-scoped: nur, was für die eigene Rolle bzw. den
 * eigenen Namen bestimmt ist, siehe getNotificationsForUser in store.ts) und
 * spielt einen Ton, sobald eine neue, noch ungelesene Benachrichtigung
 * auftaucht — nicht beim allerersten Laden, sonst würde jeder Seitenaufruf
 * mit offenen Altmeldungen sofort piepen.
 */
export function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const notifications = usePolling<NotificationsResponse>("/api/notifications", 6000);
  const [open, setOpen] = useState(false);
  const seenIds = useRef<Set<string> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const list = notifications.data?.notifications ?? [];
  const unread = user ? list.filter((n) => !n.readBy.includes(user.name)) : [];

  useEffect(() => {
    if (!notifications.data) return;
    const currentIds = new Set(list.map((n) => n.id));
    if (seenIds.current) {
      const hasNewUnread = list.some((n) => !seenIds.current!.has(n.id) && user && !n.readBy.includes(user.name));
      if (hasNewUnread) playNotificationSound();
    }
    seenIds.current = currentIds;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications.data]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function markRead(ids: string[]) {
    if (ids.length === 0) return;
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    await notifications.refetch();
  }

  function openNotification(n: NotificationRecord) {
    setOpen(false);
    markRead([n.id]);
    router.push(n.href);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Benachrichtigungen"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-navy-700 hover:bg-navy-900/5"
      >
        <BellIcon className="h-5 w-5" />
        {unread.length > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[90vw] rounded-2xl border border-navy-900/8 bg-white shadow-lg shadow-navy-950/10">
          <div className="flex items-center justify-between border-b border-navy-900/8 px-4 py-3">
            <span className="text-sm font-semibold text-navy-900">Benachrichtigungen</span>
            {unread.length > 0 ? (
              <button
                type="button"
                onClick={() => markRead(unread.map((n) => n.id))}
                className="text-xs font-medium text-amber-600 hover:text-amber-700"
              >
                Alle als gelesen markieren
              </button>
            ) : null}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {list.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-navy-700/50">Keine Benachrichtigungen.</p>
            ) : (
              list.map((n) => {
                const isUnread = user ? !n.readBy.includes(user.name) : false;
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => openNotification(n)}
                    className={`block w-full border-b border-navy-900/6 px-4 py-3 text-left text-sm transition-colors last:border-b-0 hover:bg-mist-100 ${
                      isUnread ? "bg-amber-400/5" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {isUnread ? <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" /> : null}
                      <div className={isUnread ? "" : "pl-3.5"}>
                        <div className="text-navy-800">{n.message}</div>
                        <div className="mt-0.5 text-xs text-navy-700/50">{formatRelativeTime(n.createdAt)}</div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
