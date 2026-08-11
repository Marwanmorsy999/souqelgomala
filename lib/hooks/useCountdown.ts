/**
 * useCountdown — real-time countdown timer (spec §10 DEALS COUNTDOWN).
 *
 * Returns { days, hours, minutes, seconds } counting down to `target`.
 * Updates every second. Returns null when target is in the past.
 */
import { useEffect, useState } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function useCountdown(target: string | Date | null): TimeLeft | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!target) return null;

  const diff = new Date(target).getTime() - now;
  if (diff <= 0) return null;

  const seconds = Math.floor(diff / 1000) % 60;
  const minutes = Math.floor(diff / (1000 * 60)) % 60;
  const hours = Math.floor(diff / (1000 * 60 * 60)) % 24;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  return { days, hours, minutes, seconds };
}

/** Pad a number to 2 digits (e.g. 5 → "05"). */
export function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}
