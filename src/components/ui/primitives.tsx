import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRightIcon } from "@/components/ui/icons";

const COLOR_PREFIXES = [
  "hover:bg-",
  "hover:text-",
  "hover:border-",
  "focus-visible:outline-",
  "bg-",
  "text-",
  "border-",
];

/**
 * Merges a base Tailwind class string with caller overrides, dropping any base
 * utility whose color prefix (bg-, text-, border-, ...) is re-specified in the
 * override — Tailwind's cascade order otherwise depends on stylesheet
 * generation order, not on this order, so two same-specificity classes on one
 * element can silently pick the wrong one.
 */
function mergeClasses(base: string, overrides: string) {
  const overrideTokens = overrides.split(/\s+/).filter(Boolean);
  const overriddenPrefixes = new Set(
    overrideTokens
      .map((token) => COLOR_PREFIXES.find((prefix) => token.startsWith(prefix)))
      .filter((p): p is string => Boolean(p)),
  );
  const baseTokens = base
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => {
      const prefix = COLOR_PREFIXES.find((p) => token.startsWith(p));
      return !(prefix && overriddenPrefixes.has(prefix));
    });
  return [...baseTokens, ...overrideTokens].join(" ");
}

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`container-page ${className}`}>{children}</div>;
}

export function Section({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`py-16 sm:py-24 ${className}`}>
      {children}
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-600">
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={`max-w-2xl ${align === "center" ? "mx-auto text-center" : ""}`}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="mt-3 text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">{title}</h2>
      {description ? <p className="mt-4 text-base leading-relaxed text-navy-700/80">{description}</p> : null}
    </div>
  );
}

export function Button({
  href,
  children,
  variant = "primary",
  className = "",
  type,
  onClick,
  icon = true,
}: {
  href?: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "outline";
  className?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  icon?: boolean;
}) {
  const styles: Record<string, string> = {
    primary:
      "bg-amber-500 text-navy-950 hover:bg-amber-400 shadow-sm shadow-amber-900/10 focus-visible:outline-amber-500",
    secondary:
      "bg-navy-900 text-white hover:bg-navy-800 focus-visible:outline-navy-900",
    outline:
      "border border-navy-300/40 text-navy-900 hover:bg-navy-900/5 focus-visible:outline-navy-500",
    ghost: "text-navy-900 hover:bg-navy-900/5 focus-visible:outline-navy-500",
  };

  const cls = `inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${mergeClasses(styles[variant], className)}`;

  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
        {icon ? <ArrowRightIcon className="h-4 w-4" /> : null}
      </Link>
    );
  }

  return (
    <button type={type ?? "button"} onClick={onClick} className={cls}>
      {children}
      {icon ? <ArrowRightIcon className="h-4 w-4" /> : null}
    </button>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  const base = "rounded-2xl border border-navy-900/8 bg-white p-6 shadow-sm shadow-navy-950/5";
  return <div className={mergeClasses(base, className)}>{children}</div>;
}

export function Badge({ children, tone = "navy" }: { children: ReactNode; tone?: "navy" | "amber" | "green" }) {
  const tones: Record<string, string> = {
    navy: "bg-navy-900/8 text-navy-800",
    amber: "bg-amber-400/15 text-amber-700",
    green: "bg-emerald-500/10 text-emerald-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}
