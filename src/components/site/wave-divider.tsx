/**
 * A shape divider between two sections. `fillClassName` sets the wave's color
 * via `fill-*` (usually matching the section that follows), so it reads as
 * that next section "washing" up over the current one.
 */
export function WaveDivider({
  fillClassName = "fill-mist-50",
  flip = false,
  className = "",
}: {
  fillClassName?: string;
  flip?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none w-full overflow-hidden leading-[0] ${flip ? "rotate-180" : ""} ${className}`}
    >
      <svg
        viewBox="0 0 1440 90"
        preserveAspectRatio="none"
        className={`h-12 w-full sm:h-20 ${fillClassName}`}
      >
        <path d="M0,32 C240,80 480,0 720,24 C960,48 1200,88 1440,40 L1440,90 L0,90 Z" />
      </svg>
    </div>
  );
}
