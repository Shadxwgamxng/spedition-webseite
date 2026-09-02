"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/site/logo";
import { navLinks } from "@/lib/data";
import { MenuIcon, CloseIcon, LockIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/primitives";

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-navy-900/8 bg-white/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between sm:h-20">
        <Logo />

        <nav className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`group relative py-1 text-sm font-medium transition-colors hover:text-amber-600 ${
                  active ? "text-amber-600" : "text-navy-800"
                }`}
              >
                {link.label}
                <span
                  className={`absolute inset-x-0 -bottom-0.5 h-0.5 origin-left scale-x-0 bg-amber-500 transition-transform duration-300 group-hover:scale-x-100 ${
                    active ? "scale-x-100" : ""
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/mitarbeiter/login"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-700 hover:text-navy-900"
          >
            <LockIcon className="h-4 w-4" />
            Mitarbeiter Login
          </Link>
          <Button href="/auftrag" icon={false}>
            Auftrag einreichen
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menü öffnen"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-navy-900 lg:hidden"
        >
          {open ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-navy-900/8 bg-white lg:hidden">
          <nav className="container-page flex flex-col gap-1 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy-800 hover:bg-navy-900/5"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-navy-900/8 pt-4">
              <Link
                href="/mitarbeiter/login"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium text-navy-700 hover:bg-navy-900/5"
              >
                <LockIcon className="h-4 w-4" />
                Mitarbeiter Login
              </Link>
              <Button href="/auftrag" icon={false} className="justify-center">
                Auftrag einreichen
              </Button>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
