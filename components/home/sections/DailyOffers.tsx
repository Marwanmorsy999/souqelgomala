"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { ClientImage } from "@/components/ui/client-image";
import { OfferProductCard } from "@/components/home/OfferProductCard";
import { getDailyOffers, type DailyOffersPayload } from "@/lib/services/catalog";
import { waLink } from "@/lib/site";
import type { Product, Offer } from "@/lib/types";

/**
 * Daily Offers section — "🔥 عروض النهارده"
 *
 * This is the primary recurring-engagement surface on the homepage. It pulls
 * real, admin-managed data:
 *   - Campaign offers from the D1 `offers` table (when the admin module ships)
 *   - Discounted products (offer_price / compare_at pricing)
 *   - Featured products (is_featured flag)
 *
 * No prices or offers are ever invented — if nothing is available the section
 * degrades to a WhatsApp call-to-action that matches the business's daily
 * social-media workflow.
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
        /* catalog unavailable — fall through to empty state */
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const hasCampaignOffers = data && data.offers.length > 0;
  const hasProducts = data && (data.discounted.length > 0 || data.featured.length > 0);
  const hasContent = hasCampaignOffers || hasProducts;

  // Merge discounted + featured into a single deduplicated product list.
  const offerProducts: Product[] = data
    ? [
        ...data.discounted,
        ...data.featured.filter(
          (f) => !data.discounted.some((d) => d.id === f.id),
        ),
      ].slice(0, 12)
    : [];

  if (loading) {
    return (
      <section id="offers" className="scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeader loaded={false} />
          <div className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:px-0 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[4/3] w-64 shrink-0 snap-start animate-pulse rounded-2xl bg-muted md:w-auto"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="offers" className="scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader loaded={true} data={data ?? undefined} />

        {hasContent ? (
          <div className="flex flex-col gap-6">
            {/* Campaign offers (when available) */}
            {hasCampaignOffers &&
              data!.offers.map((offer) => (
                <CampaignOfferCard
                  key={offer.id}
                  offer={offer}
                  onOpen={onOpen}
                />
              ))}

            {/* Featured + discounted product carousel */}
            {offerProducts.length > 0 && (
              <ProductCarousel
                products={offerProducts}
                label="📦 منتجات مخفضة ومميزة"
                onOpen={onOpen}
              />
            )}
          </div>
        ) : (
          /* Empty state — honest, matches the social-media-first workflow */
          <EmptyOffersState />
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers & sub-components                                           */
/* ------------------------------------------------------------------ */

function SectionHeader({
  loaded,
  data,
}: {
  loaded: boolean;
  data?: DailyOffersPayload;
}) {
  return (
    <div className="mb-5 flex flex-col gap-1">
      <h2 className="text-2xl font-black text-primary sm:text-3xl">
        🔥 عروض النهارده
      </h2>
      <p className="text-sm text-muted-foreground">
        أحدث عروض وأسعار سوق الجملة
      </p>
      {!loaded && <div className="h-3 w-32 animate-pulse rounded bg-muted" />}
      {loaded && data && (
        <p
          className="text-xs text-muted-foreground"
          aria-label="آخر تحديث"
          title={data.updatedAt}
        >
          آخر تحديث: اليوم{' '}
          {new Date(data.updatedAt).toLocaleTimeString('ar-EG', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          })}
        </p>
      )}
    </div>
  );
}

function CampaignOfferCard({
  offer,
  onOpen,
}: {
  offer: Offer;
  onOpen: (product: Product) => void;
}) {
  const discountText =
    offer.discountType === 'percentage' && offer.value
      ? `${Math.round(offer.value)}% خصم`
      : offer.discountType === 'fixed_price' && offer.value
        ? `${offer.value} ج.م خصم`
        : offer.discountType === 'buy_x_get_y' && offer.buyX && offer.getY
          ? `اشترِ ${offer.buyX} واحصل على ${offer.getY} مجاناً`
          : 'عرض خاص';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-orange-200 bg-gradient-to-b from-orange-50/60 to-transparent p-4 dark:border-orange-900 dark:from-orange-950/30"
    >
      {offer.banner && (
        <div className="mb-3 aspect-[3/1] w-full overflow-hidden rounded-xl">
          <ClientImage
            src={offer.banner}
            alt={offer.title}
            className="aspect-[3/1] w-full rounded-xl"
            imgClassName="size-full object-cover"
          />
        </div>
      )}

      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-accent px-3 py-1 text-xs font-black text-accent-foreground shadow-sm">
          {discountText}
        </span>
        <h3 className="font-black text-foreground">{offer.title}</h3>
      </div>

      {offer.products.length > 0 && (
        <div className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
          {offer.products.map((p) => (
            <OfferProductCard key={p.id} product={p} onOpen={onOpen} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function ProductCarousel({
  products,
  label,
  onOpen,
}: {
  products: Product[];
  label: string;
  onOpen: (product: Product) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-black text-foreground">{label}</p>
      <div className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:snap-none md:overflow-visible md:px-0 md:gap-4 lg:grid-cols-3">
        {products.map((p) => (
          <OfferProductCard key={p.id} product={p} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

function EmptyOffersState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card p-6 text-center md:py-10">
      <p className="text-sm font-bold text-muted-foreground">
        ما فيش عروض مسجلة دلوقتي على الموقع.
      </p>
      <p className="text-xs text-muted-foreground">
        بننشر العروض اليومية على صفحتنا على الفيس وإنستجرام وتيك توك.
      </p>
      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <MessageCircle className="size-4" />
        استفسر عن العروض على واتساب
      </a>
    </div>
  );
}
