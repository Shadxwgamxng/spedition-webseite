/**
 * Baltic Freight brand mark: a forward-pointing route chevron over a wave,
 * standing for "shipping route" + "Baltic Sea". Colors are hard-coded hex
 * (not Tailwind classes) so the exact same mark can be reused verbatim as the
 * static favicon (`app/icon.svg`), which renders outside any page CSS.
 */
export function LogoMark({ light = false, className = "" }: { light?: boolean; className?: string }) {
  const badge = light ? "#ff9f3d" : "#0a2338";
  const chevron = light ? "#0a2338" : "#ff9f3d";
  const wave = light ? "#0a233866" : "#2ec8b6";

  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="9" fill={badge} />
      <path d="M13 9 L25 20 L13 31" stroke={chevron} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M5 34 C10 30.5 14 30.5 19 34 C24 37.5 28 37.5 33 34"
        stroke={wave}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
