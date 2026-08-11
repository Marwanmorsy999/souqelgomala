"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { getDailyOffers } from "@/lib/services/catalog";
import type { Offer } from "@/lib/types";
import { useCountdown, pad2 } from "@/lib/hooks/useCountdown";

/**
 * Deals Countdown Strip (spec §10 — DEALS COUNTDOWN STRIP).
 *
 * Renders a 44px-high sticky-first strip showing a real-time countdown to
 * the end of the current daily offers. The deadline is derived from the
 * earliest `endDate` among active offers returned by the D1 catalog API.
 *
 *   - Container: bg-surface, border-bottom border-default, height 44px
 *   - Label pill: bg-brand-orange, badge-text, radius-sm
 *   - Timer blocks: bg-nav, white text, 12px/700, radius-sm, pad 2px 6px
 *   - Colons: text-muted (text-secondary)
 *   - Spec rule: timer updates every second via JS, no decorative animation
 */
export function DealsCountdown() {
  const [deadline, setDeadline] = useState<string | null>(null);
  const [hasOffers, setHasOffers] = useState(false);

  useEffect(() => {
    let active = true;
    getDailyOffers()
      .then((payload) => {
        if (!active) return;
        const activeOffers = (payload.offers ?? []).filter(
          (o: Offer) => o.status === "active" && o.endDate,
        );
        if (activeOffers.length > 0) {
          setHasOffers(true);
          // Earliest end date among active offers = the countdown target
          const earliest = activeOffers.reduce((min: Offer, o: Offer) =>
            new Date(o.endDate).getTime() < new Date(min.endDate).getTime()
              ? o
              : min,
          );
          setDeadline(earliest.endDate);
        }
      })
      .catch(() => {
        /* catalog unavailable — strip stays hidden */
      });
    return () => {
      active = false;
    };
  }, []);

  const timeLeft = useCountdown(deadline);

  // Don't render if no active offers with deadlines
  if (!hasOffers || !timeLeft) return null;

  const blocks = [
    { label: "يوم", value: timeLeft.days },
    { label: "ساعة", value: timeLeft.hours },
    { label: "دقيقة", value: timeLeft.minutes },
    { label: "ثانية", value: timeLeft.seconds },
  ];

  return (
    <div className="sticky top-14 z-30 hidden sm:block w-full bg-bg-surface border-b border-border-default">
      <div className="site-section mx-auto flex h-11 items-center gap-3">
        <span className="flex items-center gap-1.5 rounded-sm bg-brand-orange px-2.5 py-0.5 text-[10px] font-black text-white">
          <Clock className="size-3" />
          عروض النهارده
        </span>
        <span className="text-[11px] text-text-secondary">ينتهي خلال:</span>

        <div className="flex items-center gap-0.5 font-mono">
          {blocks.map((block, i) => (
            <>
              <span
                key={block.label}
                className="flex min-w-7 items-center justify-center gap-0.5 rounded-sm bg-nav px-1 py-0.5 text-center align-baseline text-[11px] font-black text-white"
              >
                {pad2(block.value)}
                <span className="text-[9px] text-muted-foreground/70">{block.label}</span>
              </span>
              {i < blocks.length - 1 && <span className="text-[11px] text-text-muted">:</span>}
            </>
          ))}
        </div>

        <span className="mr-auto text-[11px] text-text-muted">
          {timeLeft.days === 0 && timeLeft.hours < 2
            ? "آخر فرصة! اطلب دلاري"
            : "اشترِ قبل ما ينتهي"}
        </span>
      </div>
    </div>
  );
}
