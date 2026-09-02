import { MapPinIcon, TruckIcon } from "@/components/ui/icons";

/**
 * Abstract hero graphic: an animated shipping route between two ports, standing
 * in for Baltic Freight's national ⇄ Baltic Sea network. Pure CSS/SVG, no
 * external image assets.
 */
export function RouteIllustration({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 600 520" fill="none" className="h-full w-full">
        <circle cx="120" cy="440" r="220" className="fill-teal-500/10" />
        <circle cx="480" cy="80" r="160" className="fill-amber-400/10" />

        <path
          d="M90,430 C170,340 210,260 300,270 C390,280 410,170 480,95"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="text-white/15"
        />
        <path
          d="M90,430 C170,340 210,260 300,270 C390,280 410,170 480,95"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="route-line text-amber-400"
        />

        <g>
          <circle cx="90" cy="430" r="16" className="pulse-ring fill-teal-400/40" style={{ transformBox: "fill-box", transformOrigin: "center" }} />
          <circle cx="90" cy="430" r="7" className="fill-teal-300" />
        </g>
        <g>
          <circle cx="480" cy="95" r="16" className="pulse-ring fill-amber-400/40" style={{ transformBox: "fill-box", transformOrigin: "center" }} />
          <circle cx="480" cy="95" r="7" className="fill-amber-300" />
        </g>
      </svg>

      <div
        className="float-y absolute flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400 text-navy-950 shadow-lg shadow-amber-900/30"
        style={{ left: "48%", top: "48%" }}
      >
        <TruckIcon className="h-5 w-5" />
      </div>

      <div className="absolute flex items-center gap-1.5 text-xs font-medium text-white/70" style={{ left: "6%", top: "83%" }}>
        <MapPinIcon className="h-3.5 w-3.5 text-teal-300" />
        Falkenwalde
      </div>
      <div className="absolute flex items-center gap-1.5 text-xs font-medium text-white/70" style={{ left: "76%", top: "12%" }}>
        <MapPinIcon className="h-3.5 w-3.5 text-amber-300" />
        Ostseeraum
      </div>
    </div>
  );
}
