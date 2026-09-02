import Link from "next/link";
import Image from "next/image";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <Image
        src="/brand/logo-icon.png"
        alt="Baltic Freight"
        width={519}
        height={411}
        priority
        className="h-9 w-auto shrink-0 sm:h-10"
      />
      <span className={`flex flex-col leading-tight ${light ? "text-white" : "text-navy-900"}`}>
        <span className="text-sm font-bold tracking-tight sm:text-base">Baltic Freight</span>
        <span className={`text-[11px] font-medium uppercase tracking-wider ${light ? "text-white/60" : "text-navy-700/60"}`}>
          Spedition GmbH
        </span>
      </span>
    </Link>
  );
}
