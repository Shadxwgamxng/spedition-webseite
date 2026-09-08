"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/site/logo";
import { useAuth } from "@/lib/auth";
import { LockIcon } from "@/components/ui/icons";
import Link from "next/link";

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace("/mitarbeiter");
    }
  }, [user, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    const result = await login(username, password);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error ?? "Anmeldung fehlgeschlagen.");
      return;
    }
    setError(null);
    router.push("/mitarbeiter");
  }

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
            Melden Sie sich mit Ihrem internen Benutzerkonto an, um Disposition, Lager, Fuhrpark und weitere Systeme
            zu nutzen.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-navy-800">
                Benutzername
              </label>
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="w-full rounded-xl border border-navy-900/15 bg-white px-3.5 py-2.5 text-sm text-navy-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-navy-800">
                Passwort
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-navy-900/15 bg-white px-3.5 py-2.5 text-sm text-navy-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-navy-950 transition-colors hover:bg-amber-400 disabled:opacity-60"
            >
              {submitting ? "Wird geprüft…" : "Anmelden"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-navy-700/50">
            Noch kein Konto? Wenden Sie sich an Ihre Geschäftsführung.
          </p>

          <Link href="/" className="mt-4 block text-center text-xs font-medium text-navy-700/60 hover:text-navy-900">
            ← Zurück zur öffentlichen Website
          </Link>
        </div>
      </div>
    </div>
  );
}
