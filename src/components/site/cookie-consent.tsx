"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { CookieIcon } from "@/components/ui/icons";

const STORAGE_KEY = "bf_cookie_consent";
/** Name des window-Events, über das ein anderer Teil der Seite (z. B. der
 * "Cookie-Einstellungen"-Link im Footer) den Banner erneut öffnen kann, damit
 * das im Banner gegebene Versprechen "Sie können Ihre Auswahl jederzeit
 * ändern" auch tatsächlich stimmt. */
export const OPEN_COOKIE_SETTINGS_EVENT = "bf:open-cookie-settings";

type ConsentChoice = { functional: boolean; statistics: boolean };
type StoredConsent = ConsentChoice & { decidedAt: string };

function readStoredConsent(): StoredConsent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.functional === "boolean" && typeof parsed?.statistics === "boolean") {
      return parsed as StoredConsent;
    }
    return null;
  } catch {
    return null;
  }
}

function writeStoredConsent(choice: ConsentChoice) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...choice, decidedAt: new Date().toISOString() }));
  } catch {
    // z. B. privater Modus mit blockiertem Storage - Banner erscheint dann beim nächsten Aufruf einfach erneut
  }
}

function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange?: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-amber-500" : "bg-navy-900/15"} ${
        disabled ? "cursor-not-allowed opacity-70" : ""
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function ConsentRow({ title, description, toggle }: { title: string; description: string; toggle: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-navy-900/10 bg-mist-100/60 p-4">
      <div>
        <div className="text-sm font-semibold text-navy-900">{title}</div>
        <p className="mt-0.5 text-xs text-navy-700/60">{description}</p>
      </div>
      {toggle}
    </div>
  );
}

/** Öffnet den Cookie-Consent-Banner erneut (siehe unten) - für den Footer-Link
 * "Cookie-Einstellungen", eine eigene Client-Komponente, weil Footer.tsx eine
 * async Server Component ist und selbst keinen onClick-Handler haben kann. */
export function CookieSettingsLink({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT))}
      className={className}
    >
      Cookie-Einstellungen
    </button>
  );
}

/**
 * Cookie-Consent-Banner für den öffentlichen Bereich (siehe (site)/layout.tsx).
 * Speichert die Entscheidung client-seitig in localStorage
 * (bf_cookie_consent) - erscheint erneut, sobald das fehlt (erster Besuch,
 * anderer Browser, gelöschte Website-Daten) oder wenn der
 * "Cookie-Einstellungen"-Link im Footer OPEN_COOKIE_SETTINGS_EVENT feuert.
 * "Notwendig" ist immer an (Login/Session-Cookies, siehe src/lib/server/session.ts)
 * und nicht abwählbar.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [functional, setFunctional] = useState(true);
  const [statistics, setStatistics] = useState(false);

  useEffect(() => {
    // Runs once on mount: die gespeicherte Entscheidung liegt in localStorage,
    // dort ist serverseitig nichts synchron lesbar.
    const stored = readStoredConsent();
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFunctional(stored.functional);
      setStatistics(stored.statistics);
    } else {
      setVisible(true);
    }

    function reopen() {
      const current = readStoredConsent();
      if (current) {
        setFunctional(current.functional);
        setStatistics(current.statistics);
      }
      setVisible(true);
    }
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
  }, []);

  function decide(choice: ConsentChoice) {
    setFunctional(choice.functional);
    setStatistics(choice.statistics);
    writeStoredConsent(choice);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-950/60 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="border-b border-red-200 bg-red-50 px-5 py-3 text-center text-xs font-bold uppercase tracking-wide text-red-700">
          ⚠️ Dieses Portal ist ein fiktives System für RP-Zwecke in FiveM. ⚠️
        </div>

        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-900/5 text-navy-900">
              <CookieIcon className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-navy-900">Datenschutz-Einstellungen</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-navy-700/70">
            Wir verwenden Cookies und vergleichbare Technologien. Technisch notwendige Cookies sind für den Betrieb
            des Portals erforderlich. Weitere Cookies setzen wir nur mit Ihrer Einwilligung ein. Sie können Ihre
            Auswahl jederzeit ändern. Details finden Sie in unserer{" "}
            <Link href="/datenschutz" className="underline hover:text-navy-900">
              Datenschutzerklärung
            </Link>
            .
          </p>

          <div className="mt-5 space-y-3">
            <ConsentRow
              title="Notwendig"
              description="Login, Sitzung und Sicherheit. Ohne diese Cookies funktioniert das Portal nicht."
              toggle={<Toggle checked disabled />}
            />
            <ConsentRow
              title="Funktional"
              description="Komforteinstellungen wie Theme, Ansichten und zuletzt genutzte Filter."
              toggle={<Toggle checked={functional} onChange={setFunctional} />}
            />
            <ConsentRow
              title="Statistik"
              description="Anonyme Auswertung der Nutzung zur Verbesserung des Angebots."
              toggle={<Toggle checked={statistics} onChange={setStatistics} />}
            />
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => decide({ functional: false, statistics: false })}
              className="rounded-full border border-navy-900/15 px-4 py-2 text-xs font-semibold text-navy-700 hover:bg-mist-100"
            >
              Nur notwendige
            </button>
            <button
              type="button"
              onClick={() => decide({ functional, statistics })}
              className="rounded-full border border-navy-900/15 px-4 py-2 text-xs font-semibold text-navy-700 hover:bg-mist-100"
            >
              Auswahl speichern
            </button>
            <button
              type="button"
              onClick={() => decide({ functional: true, statistics: true })}
              className="rounded-full bg-amber-500 px-5 py-2 text-xs font-semibold text-navy-950 hover:bg-amber-400"
            >
              Alle akzeptieren
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
