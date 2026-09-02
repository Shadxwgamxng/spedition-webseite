import Link from "next/link";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-black tracking-tight ${
          light ? "bg-amber-400 text-navy-950" : "bg-navy-900 text-amber-400"
        }`}
      >
        BF
      </span>
      <span className={`flex flex-col leading-tight ${light ? "text-white" : "text-navy-900"}`}>
        <span className="text-sm font-bold tracking-tight sm:text-base">Baltic Freight</span>
        <span className={`text-[11px] font-medium uppercase tracking-wider ${light ? "text-white/60" : "text-navy-700/60"}`}>
          Spedition GmbH
        </span>
      </span>
    </Link>
  );
}
