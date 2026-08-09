"use client";

import { BadgeCheck, CalendarDays, HandCoins, MessageCircle, Store, Truck } from "lucide-react";
import { SITE, heroConfig, waLink } from "@/lib/site";
import { heroImageUrl } from "@/lib/cloudinary/urls";

type Props = {
  onShop: () => void;
  onOffers: () => void;
};

/**
 * Hero — the سوق الجملة identity block.
 *
 * Photo handling (replaceable through the existing asset/content system):
 *   - `heroConfig.publicId` (Cloudinary public_id) → rendered via `heroImageUrl()`
 *   - `heroConfig.image` (direct file URL, e.g. `/photos/shop.jpg`)
 * Until the business supplies a real photo of the shop, BOTH are empty and the
 * section renders an intentional branded deep-green fallback — never generic
 * supermarket/mall stock photography.
 */
export function Hero({ onShop, onOffers }: Props) {
  const photo = heroConfig.publicId
    ? heroImageUrl(heroConfig.publicId)
    : heroConfig.image;

  return (
    <section id="home" className="relative overflow-hidden">
      {/* Background image — real shop photo OR branded fallback */}
      {photo ? (
        <div className="absolute inset-0">
          <img
            src={photo}
            alt={heroConfig.alt ?? SITE.name}
            className="size-full object-cover object-center"
            loading="eager"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/25" />
        </div>
      ) : (
        <div className="hero-branded absolute inset-0" aria-hidden="true">
          <div className="absolute -left-16 -top-20 size-72 rounded-full border border-white/10" />
          <div className="absolute -bottom-24 -right-20 size-96 rounded-full border border-white/10" />
        </div>
      )}

      <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-14 sm:pt-20 md:pb-20 md:pt-24">
        {/* Local shop badge */}
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-bold text-white backdrop-blur">
          <Store className="size-4 text-accent" />
          محل بقالة جملة وقطاعي — كفر شكر، القليوبية
        </span>

        <p className="mt-6 text-sm font-black tracking-wide text-accent sm:text-base">
          {SITE.name}
        </p>
        <h1 className="mt-1 max-w-3xl text-4xl font-black leading-[1.15] text-white sm:text-5xl md:text-6xl">
          {SITE.tagline}
        </h1>

        <p className="mt-4 max-w-lg text-base leading-7 text-white/90 sm:text-lg">
          بنبيع كل يوم بأسعار الجملة للبيت والمحل — شوف عروض النهارده أو ابعتلنا
          طلبك على الواتساب وخليك أول اللي يوصل.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <button
            onClick={onOffers}
            className="flex h-12 items-center gap-2 rounded-2xl bg-accent px-7 text-base font-black text-accent-foreground shadow-lg shadow-black/25 transition-transform hover:scale-[1.02] active:scale-95"
          >
            <CalendarDays className="size-5" />
            عروض النهارده 🔥
          </button>
          <button
            onClick={onShop}
            className="h-12 rounded-2xl border border-white/40 bg-white/10 px-6 text-base font-bold text-white backdrop-blur transition-colors hover:bg-white/20"
          >
            شوف المنتجات
          </button>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden h-12 items-center gap-2 rounded-2xl border border-accent/50 bg-accent/15 px-5 text-sm font-bold text-accent backdrop-blur transition-colors hover:bg-accent/25 sm:flex"
          >
            <MessageCircle className="size-4" />
            اطلب واتساب
          </a>
        </div>

        <div className="mt-9 flex flex-wrap gap-2.5" aria-label="مميزات سوق الجملة">
          {[
            { icon: HandCoins, label: "أسعار جملة وقطاعي" },
            { icon: Truck, label: "توصيل في كفر شكر والقليوبية" },
            { icon: BadgeCheck, label: "الدفع كاش عند الاستلام" },
          ].map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur"
            >
              <Icon className="size-4 text-accent" />
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
