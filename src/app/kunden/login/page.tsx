"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { useCustomerAuth } from "@/lib/customer-auth";
import { DiscordIcon, LockIcon } from "@/components/ui/icons";

const ERROR_MESSAGES: Record<string, string> = {
  unlinked:
    "Dieser Discord-Account ist keinem Kundenkonto zugeordnet oder das interne Dispositionssystem wurde für Sie noch nicht freigeschaltet. Bitte wenden Sie sich an Ihren Ansprechpartner bei Baltic Freight.",
  state: "Die Anmeldung ist abgelaufen oder ungültig. Bitte versuchen Sie es erneut.",
  config: "Der Discord-Login ist auf diesem Server noch nicht eingerichtet. Bitte kontaktieren Sie Baltic Freight.",
  token: "Discord konnte nicht bestätigt werden. Bitte versuchen Sie es erneut.",
  profile: "Ihr Discord-Profil konnte nicht geladen werden. Bitte versuchen Sie es erneut.",
  unknown: "Bei der Anmeldung ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es erneut.",
};

export default function KundenLoginPage() {
  const { customer, status } = useCustomerAuth();
  const router = useRouter();
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const error = errorCode ? (ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.unknown) : null;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setErrorCode(new URLSearchParams(window.location.search).get("error"));
  }, []);

  useEffect(() => {
    if (status === "ready" && customer) {
      router.replace("/kunden");
    }
  }, [status, customer, router]);

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
            <span className="text-xs font-semibold uppercase tracking-wider">Internes Dispositionssystem</span>
          </div>
          <h1 className="mt-3 text-2xl font-bold text-navy-900">Kunden-Login</h1>
          <p className="mt-1 text-sm text-navy-700/70">
            Als Bestandskunde können Sie Aufträge direkt einreichen und Ihren Auftragsstatus einsehen. Der Zugang
            wird von Baltic Freight einmalig über Ihren Discord-Account freigeschaltet.
          </p>

          {error ? <p className="mt-4 text-sm font-medium text-red-600">{error}</p> : null}

          <a
            href="/api/auth/discord/login?purpose=customer"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#5865F2] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#4752C4]"
          >
            <DiscordIcon className="h-5 w-5" />
            Mit Discord anmelden
          </a>

          <p className="mt-6 text-center text-xs text-navy-700/50">
            Noch kein Zugang? Wenden Sie sich an Ihren Ansprechpartner bei Baltic Freight.
          </p>

          <Link href="/" className="mt-4 block text-center text-xs font-medium text-navy-700/60 hover:text-navy-900">
            ← Zurück zur öffentlichen Website
          </Link>
        </div>
      </div>
    </div>
  );
}
