"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/site/logo";
import { useAuth } from "@/lib/auth";
import { LockIcon } from "@/components/ui/icons";
import Link from "next/link";

const ERROR_MESSAGES: Record<string, string> = {
  unlinked:
    "Dieser Discord-Account ist keinem Mitarbeiter-Konto zugeordnet. Bitte wende dich an die Geschäftsführung, damit sie deinen Discord-Account verknüpft.",
  state: "Die Anmeldung ist abgelaufen oder ungültig. Bitte versuche es erneut.",
  config: "Discord-Login ist auf diesem Server noch nicht eingerichtet. Bitte die Geschäftsführung informieren.",
  token: "Discord konnte nicht bestätigt werden. Bitte versuche es erneut.",
  profile: "Discord-Profil konnte nicht geladen werden. Bitte versuche es erneut.",
  unknown: "Bei der Anmeldung ist ein unerwarteter Fehler aufgetreten. Bitte versuche es erneut.",
};

export default function LoginPage() {
  const { user, status } = useAuth();
  const router = useRouter();
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const error = errorCode ? (ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.unknown) : null;

  useEffect(() => {
    // Client-only read of the redirect error param — avoids the Suspense
    // boundary that Next.js requires around useSearchParams().
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setErrorCode(new URLSearchParams(window.location.search).get("error"));
  }, []);

  useEffect(() => {
    if (status === "ready" && user) {
      router.replace("/mitarbeiter");
    }
  }, [status, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4 py-16">
      <div className="bg-grid pointer-events-none fixed inset-0 opacity-40" />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo light />
        </div>
        <div className="rounded-2xl border border-white/10 bg-white p-8 shadow-xl">
          <div className="flex items-center gap-2 text-amber-600">
            <LockIcon className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Mitarbeiterbereich</span>
          </div>
          <h1 className="mt-3 text-2xl font-bold text-navy-900">Anmelden</h1>
          <p className="mt-1 text-sm text-navy-700/70">
            Der Mitarbeiterbereich wird ausschließlich über Discord entsperrt. Deine Geschäftsführung verknüpft
            deinen Discord-Account einmalig mit deinem Mitarbeiter-Konto.
          </p>

          {error ? <p className="mt-4 text-sm font-medium text-red-600">{error}</p> : null}

          <a
            href="/api/auth/discord/login"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#5865F2] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#4752C4]"
          >
            <DiscordIcon className="h-5 w-5" />
            Mit Discord anmelden
          </a>

          <p className="mt-6 text-center text-xs text-navy-700/50">
            Noch kein verknüpftes Konto? Wende dich an deine Geschäftsführung.
          </p>

          <Link href="/" className="mt-4 block text-center text-xs font-medium text-navy-700/60 hover:text-navy-900">
            ← Zurück zur öffentlichen Website
          </Link>
        </div>
      </div>
    </div>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.317 4.369A19.79 19.79 0 0 0 15.885 3c-.21.375-.444.879-.608 1.278a18.27 18.27 0 0 0-5.487 0A12.6 12.6 0 0 0 9.182 3a19.74 19.74 0 0 0-4.435 1.371C1.578 8.94.86 13.4 1.219 17.8a19.9 19.9 0 0 0 6.052 3.05c.49-.664.926-1.371 1.302-2.115a12.9 12.9 0 0 1-2.049-.978c.172-.125.34-.256.503-.39a14.19 14.19 0 0 0 12.06 0c.166.14.334.27.503.39-.653.386-1.34.71-2.052.98.377.744.812 1.45 1.302 2.114a19.85 19.85 0 0 0 6.057-3.05c.42-5.1-.71-9.52-2.977-13.432ZM8.68 15.084c-.985 0-1.795-.907-1.795-2.02 0-1.113.792-2.02 1.795-2.02s1.813.916 1.795 2.02c0 1.113-.792 2.02-1.795 2.02Zm6.646 0c-.986 0-1.796-.907-1.796-2.02 0-1.113.792-2.02 1.796-2.02 1.003 0 1.812.916 1.795 2.02 0 1.113-.792 2.02-1.795 2.02Z" />
    </svg>
  );
}
