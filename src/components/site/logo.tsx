import Link from "next/link";
import { LogoMark } from "@/components/site/logo-mark";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <LogoMark light={light} className="h-9 w-9 shrink-0" />
      <span className={`flex flex-col leading-tight ${light ? "text-white" : "text-navy-900"}`}>
        <span className="text-sm font-bold tracking-tight sm:text-base">Baltic Freight</span>
        <span className={`text-[11px] font-medium uppercase tracking-wider ${light ? "text-white/60" : "text-navy-700/60"}`}>
          Spedition GmbH
        </span>
      </span>
    </Link>
  );
}
