"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";
import { ClientImage } from "@/components/ui/client-image";
import { OfferProductCard } from "@/components/home/OfferProductCard";
import { getDailyOffers, type DailyOffersPayload } from "@/lib/services/catalog";
import { waLink } from "@/lib/site";
import { isPlaceholderImage } from "@/lib/utils";
import type { Product } from "@/lib/types";

// Default decorative offers artwork shipped with the site. Used as a fallback
// when no admin-managed `offers_banner` promo is configured.
const DEFAULT_OFFERS_BANNER = "/offers-banner.jpg";

const dayMonthFmt = new Intl.DateTimeFormat("ar-EG", {
  day: "numeric",
  month: "long",
});

function formatDayMonth(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : dayMonthFmt.format(d);
}

/**
 * Daily Offers — "🔥 عروض النهارده" sales board.
 *
 * The section is a simple board, not a set of big campaign boxes:
 *   - Campaigns with a REAL banner render that banner (banner = visual).
 *   - All offer products (campaign + discounted + featured) are deduped into
 *     one flat board of compact cards.
 *   - No image -> text-first card, no gray placeholder area.
 *   - Mobile: intentional horizontal swipe · Desktop: static grid.
 *
 * Data always comes from the D1-backed catalog API. If nothing is active the
 * section degrades to a compact WhatsApp CTA.
 */
export function DailyOffers({ onOpen }: { onOpen: (product: Product) => void }) {
  const [data, setData] = useState<DailyOffersPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getDailyOffers()
      .then((result) => {
        if (active) setData(result);
      })
      .catch(() => {
        /* catalog unavailable — honest compact empty state */
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  // Decorative offers artwork banner (admin-managed via the offers_banner promo
  // slot). Renders nothing if unset or if the fetch fails.
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/promos?placement=offers_banner", { cache: "no-store" })
      .then((r) => r.json())
      .then((body) => {
        if (!active || !body?.success) return;
        const row = (body.data ?? []).find(
          (p: { image_url?: string }) =>
            p.image_url && !isPlaceholderImage(p.image_url),
        );
        // Admin-managed promo wins; otherwise fall back to the shipped artwork.
        setBanner(row?.image_url ?? DEFAULT_OFFERS_BANNER);
      })
      .catch(() => {
        /* banner is decorative — fall back to the shipped artwork */
        if (active) setBanner(DEFAULT_OFFERS_BANNER);
      });
    return () => {
      active = false;
    };
  }, []);

  const campaignOffers = data?.offers ?? [];

  // One flat board: campaign products first, then discounted + featured.
  const boardProducts = useMemo(() => {
    if (!data) return [];
    const seen = new Set<string>();
    const out: Product[] = [];
    const push = (p: Product) => {
      if (seen.has(p.id)) return;
      seen.add(p.id);
      out.push(p);
    };
    for (const offer of campaignOffers) for (const p of offer.products) push(p);
    for (const p of data.discounted) push(p);
    for (const p of data.featured) push(p);
    return out.slice(0, 8);
  }, [data, campaignOffers]);

  // Real banners only — never an empty / placeholder campaign area.
  const banners = campaignOffers.filter(
    (o) => o.banner && !isPlaceholderImage(o.banner) && o.products.length > 0,
  );
  const campaignRows = campaignOffers.filter((o) => o.products.length > 0);
  const hasAny = boardProducts.length > 0 || banners.length > 0;

  const today = useMemo(
    () =>
      new Intl.DateTimeFormat("ar-EG", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(new Date()),
    [],
  );

  return (
    <section id="offers" className="site-section scroll-mt-20">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-black sm:text-2xl fade-in">🔥 عروض النهارده</h2>
          <p className="mt-1 text-sm text-text-secondary fade-in" style={{ animationDelay: '0.1s' }}>{today}</p>
        </div>
        <button
          onClick={() =>
            document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })
          }
          className="text-sm font-bold text-brand-green transition-colors hover:text-brand-green-hover button-glow"
        >
          كل العروض
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-lg bg-bg-surface" />
          ))}
        </div>
      ) : hasAny ? (
        <div className="flex flex-col gap-5">
          {banners.map((offer) => (
            <div key={offer.id} className="overflow-hidden rounded-lg border border-border-default">
              <ClientImage
                src={offer.banner as string}
                alt={offer.title}
                className="aspect-[4/1]"
                imgClassName="size-full object-cover"
              />
            </div>
          ))}

          {campaignRows.length > 0 && (
            <div className="flex flex-col gap-1">
              {campaignRows.map((offer) => (
                <p key={offer.id} className="flex flex-wrap items-baseline gap-x-3 text-sm">
                  <span className="font-bold text-foreground">{offer.title}</span>
                  {offer.endDate && (
                    <span className="text-xs text-text-muted">
                      حتى {formatDayMonth(offer.endDate)}
                    </span>
                  )}
                </p>
              ))}
            </div>
          )}

          {boardProducts.length > 0 && (
            <div className="-mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-2 sm:-mx-4 sm:px-4 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 lg:grid-cols-4">
              {boardProducts.map((p) => (
                <div key={p.id} className="w-48 shrink-0 snap-start md:w-auto">
                  <OfferProductCard product={p} onOpen={onOpen} />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <EmptyOffersState />
      )}

      {banner && (
        <div className="mt-5 overflow-hidden rounded-lg border border-border-default">
          <ClientImage
            src={banner}
            alt="عروض النهارده"
            className="aspect-[3/2]"
            imgClassName="size-full object-cover"
          />
        </div>
      )}
    </section>
  );
}

function EmptyOffersState() {
  return (
    <div className="flex flex-col items-start gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="max-w-md text-sm leading-6 text-foreground">
        مفيش عروض مُسجلة على الموقع لسه النهارده — بننشر عروض اليوم على صفحة
        الفيسبوك والإنستجرام، أو اسألنا مباشرة على واتساب.
      </p>
            <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-11 shrink-0 items-center gap-2 rounded-md bg-brand-green px-4 text-sm font-black text-white transition-colors hover:bg-brand-green-hover"
      >
        <MessageCircle className="size-4" />
        استفسر عن عروض النهارده
      </a>
    </div>
  );
}