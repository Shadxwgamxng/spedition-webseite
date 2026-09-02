"use client";

import { useEffect, useRef, useState } from "react";

const PARTS_RE = /^(\D*)([\d.,]+)(.*)$/;

/**
 * Counts a stat value up from 0 once it scrolls into view, e.g. "12.000 m²" or
 * "18+". Only the numeric portion animates — any prefix/suffix text (currency
 * signs, "+", units) is preserved as-is.
 */
export function AnimatedNumber({ value, durationMs = 1200 }: { value: string; durationMs?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);
  const started = useRef(false);

  useEffect(() => {
    // If the value can't be parsed into prefix/number/suffix, `display` just
    // keeps its useState(value) initial value — nothing to animate.
    const match = PARTS_RE.exec(value);
    if (!match) return;
    const [, prefix, numberPart, suffix] = match;
    const target = Number(numberPart.replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(target)) return;

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;
        observer.disconnect();

        const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReduced) {
          setDisplay(value);
          return;
        }

        const start = performance.now();
        function tick(now: number) {
          const progress = Math.min(1, (now - start) / durationMs);
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = Math.round(target * eased);
          setDisplay(`${prefix}${current.toLocaleString("de-DE")}${suffix}`);
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, durationMs]);

  return <span ref={ref}>{display}</span>;
}
