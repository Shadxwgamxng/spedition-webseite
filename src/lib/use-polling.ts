"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Polls a JSON GET endpoint on an interval so client components stay in sync with
 * the shared server-side store. Good enough for a demo; a production system
 * would use websockets/SSE instead of polling.
 */
export function usePolling<T>(url: string, intervalMs = 4000) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopped = useRef(false);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Request fehlgeschlagen (${res.status})`);
      const json = (await res.json()) as T;
      if (!stopped.current) {
        setData(json);
        setError(null);
      }
    } catch (err) {
      if (!stopped.current) {
        setError(err instanceof Error ? err.message : "Unbekannter Fehler");
      }
    }
  }, [url]);

  useEffect(() => {
    stopped.current = false;
    // Standard "fetch on mount" effect: refetch is async, so any setState it
    // triggers happens in a later microtask, not synchronously during this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch();
    function tick() {
      timer.current = setTimeout(async () => {
        await refetch();
        if (!stopped.current) tick();
      }, intervalMs);
    }
    tick();
    return () => {
      stopped.current = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [refetch, intervalMs]);

  return { data, error, refetch };
}
