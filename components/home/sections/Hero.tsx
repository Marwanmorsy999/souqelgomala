"use client";

import { SITE, heroConfig, waLink } from "@/lib/site";
import { heroImageUrl } from "@/lib/cloudinary/urls";

type Props = {
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
 *
 * Kept deliberately plain: name, tagline, one sentence, two actions. The real
 * shop photo (when available) is the section's main visual.
 */
export function Hero({ onOffers }: Props) {
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
        </div>
      ) : (
        <div className="hero-branded absolute inset-0" aria-hidden="true" />
      )}

      <div className="site-section relative pb-16 pt-14 sm:pb-20 sm:pt-20 md:pb-24 md:pt-28">
        <h1 className="max-w-2xl text-3xl font-black leading-[1.2] text-white sm:text-4xl md:text-5xl">
          <span className="mb-3 block text-lg font-black tracking-wide text-accent sm:text-xl">
            {SITE.name}
          </span>
          {SITE.tagline}
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-white/90 sm:text-lg">
          بقالة جملة وقطاعي في كفر شكر — بنبيع كل يوم بأسعار الجملة للبيت والمحل.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            onClick={onOffers}
            className="flex h-12 items-center gap-2 rounded-xl bg-accent px-6 text-base font-black text-accent-foreground transition-colors hover:bg-accent/90"
          >
            شوف عروض النهارده
          </button>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 text-base font-bold text-white transition-colors hover:bg-white/20"
          >
            اطلب على واتساب
          </a>
        </div>
      </div>
    </section>
  );
}
