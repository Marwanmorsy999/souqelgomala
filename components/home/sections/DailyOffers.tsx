"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Flame, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { ClientImage } from "@/components/ui/client-image";
import { OfferProductCard } from "@/components/home/OfferProductCard";
import { getDailyOffers, type DailyOffersPayload } from "@/lib/services/catalog";
import { waLink } from "@/lib/site";
import { isPlaceholderImage } from "@/lib/utils";
import type { Product, Offer } from "@/lib/types";

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
 * This is the business's daily-selling surface (posts almost every day on
 * Facebook / Instagram / TikTok). The section is kept COMPACT: if only a few
 * offers exist they stay in a tight grid — never stretched across giant empty
 * areas — and product cards with no photo render as branded info cards, never
 * as giant gray placeholder boxes.
 *
 * Data always comes from the D1-backed catalog API. If nothing is active the
 * section degrades to a compact WhatsApp CTA matching the social workflow.
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

  const campaignOffers = data?.offers ?? [];

  // Don't double-list campaign products in the discounted/featured grid.
  const campaignProductIds = useMemo(() => {
    const ids = new Set<string>();
    for (const offer of campaignOffers)
      for (const p of offer.products) ids.add(p.id);
    return ids;
  }, [campaignOffers]);

  const offerProducts = useMemo(() => {
    if (!data) return [];
    return [
      ...data.discounted,
      ...data.featured.filter((f) => !data.discounted.some((d) => d.id === f.id)),
    ]
      .filter((p) => !campaignProductIds.has(p.id))
      .slice(0, 6);
  }, [data, campaignProductIds]);

  const hasAny = campaignOffers.length > 0 || offerProducts.length > 0;

  return (
    <section id="offers" className="mx-auto max-w-6xl scroll-mt-20 px-4">
      <SectionHeader loaded={!loading} />

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : hasAny ? (
        <div className="flex flex-col gap-5">
          {campaignOffers.map((offer) => (
            <CampaignOfferCard key={offer.id} offer={offer} onOpen={onOpen} />
          ))}

          {offerProducts.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-black text-foreground">
                منتجات مخفضة ومميزة
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {offerProducts.map((p) => (
                  <OfferProductCard key={p.id} product={p} onOpen={onOpen} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyOffersState />
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers & sub-components                                           */
/* ------------------------------------------------------------------ */

function SectionHeader({ loaded }: { loaded: boolean }) {
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
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-2xl font-black text-foreground sm:text-3xl">
          🔥 عروض النهارده
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          بيع النهارده في سوق الجملة — أسعار الجملة من المحل مباشرة
        </p>
        {!loaded && (
          <div className="mt-2 h-3 w-32 animate-pulse rounded bg-muted" />
        )}
      </div>
      <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-bold text-foreground">
        <CalendarDays className="size-4 text-accent" />
        {today}
      </span>
    </div>
  );
}

function discountTextFor(offer: Offer): string {
  if (offer.discountType === "percentage" && offer.value)
    return `${Math.round(offer.value)}% خصم`;
  if (offer.discountType === "fixed_price" && offer.value)
    return `${offer.value} ج.م خصم`;
  if (offer.discountType === "buy_x_get_y" && offer.buyX && offer.getY)
    return `اشترِ ${offer.buyX} واحصل على ${offer.getY} مجاناً`;
  return "عرض خاص";
}

/* __SPLIT__ */

/** One campaign offer — compact sales row (badge + title + product grid). */
function CampaignOfferCard({
  offer,
  onOpen,
}: {
  offer: Offer;
  onOpen: (product: Product) => void;
}) {
  const products = offer.products.slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-orange-200/70 bg-gradient-to-b from-orange-50/60 to-transparent p-3 dark:border-orange-900 dark:from-orange-950/20 sm:p-4"
    >
      {offer.banner && !isPlaceholderImage(offer.banner) && (
        <div className="mb-3 overflow-hidden rounded-xl">
          <ClientImage
            src={offer.banner}
            alt={offer.title}
            className="aspect-[4/1]"
            imgClassName="size-full object-cover"
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 px-1 pb-3">
        <span className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-black text-accent-foreground shadow-sm">
          <Flame className="size-3.5" />
          {discountTextFor(offer)}
        </span>
        <h3 className="font-black text-foreground">{offer.title}</h3>
        {offer.endDate && (
          <span className="text-xs text-muted-foreground">
            ~ حتى {formatDayMonth(offer.endDate)}
          </span>
        )}
      </div>

      {products.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <OfferProductCard
              key={p.id}
              product={p}
              onOpen={onOpen}
              offerLabel="عرض النهارده"
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function EmptyOffersState() {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-bold text-foreground">
          ما فيش عروض مُسجلة النهارده على الموقع لسه 🕐
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          بننشر عروض اليوم على الفيسبوك والإنستجرام وتيك توك — تابعنا أو اسألنا
          على واتساب.
        </p>
      </div>
      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <MessageCircle className="size-4" />
        استفسر عن عروض النهارده
      </a>
    </div>
  );
}