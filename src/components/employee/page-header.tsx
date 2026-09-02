import type { ReactNode } from "react";

export function EmployeePageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-sm text-navy-700/70">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function StatCard({ label, value, hint, tone = "default" }: { label: string; value: string; hint?: string; tone?: "default" | "warn" | "good" }) {
  const toneClass =
    tone === "warn" ? "text-amber-600" : tone === "good" ? "text-emerald-600" : "text-navy-900";
  return (
    <div className="rounded-2xl border border-navy-900/8 bg-white p-5 shadow-sm shadow-navy-950/5">
      <div className="text-xs font-medium uppercase tracking-wide text-navy-700/50">{label}</div>
      <div className={`mt-2 text-2xl font-bold ${toneClass}`}>{value}</div>
      {hint ? <div className="mt-1 text-xs text-navy-700/50">{hint}</div> : null}
    </div>
  );
}
