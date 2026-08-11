"use client";

import { useSiteSettings, useWhatsappLink } from "@/components/shared/site-settings";

type Props = {
  onOffers: () => void;
};

/**
 * Hero — the سوق الجملة identity block.
 *
 * Every piece of text (business name, tagline, description, CTA labels) and
 * the photo are admin-managed via the settings dashboard (D1-backed with the
 * existing lib/site.ts values as defaults). Until a real shop photo is set the
 * section renders the same branded deep-green fallback — never generic stock.
 */
export function Hero({ onOffers }: Props) {
  const settings = useSiteSettings();
  const waLink = useWhatsappLink();
  const heroImage = settings.hero.image?.trim();
  const photo = heroImage ? heroImage : undefined;
  const headline = settings.hero.title?.trim() || settings.tagline;

  return (
    <section id="home" className="relative overflow-hidden">
      {/* Background image — real shop photo OR branded fallback */}
      {photo ? (
        <div className="absolute inset-0">
          <img
            src={photo}
            alt={settings.hero.alt || settings.name}
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
          <span className="mb-3 block text-lg font-black tracking-wide text-brand-green-light sm:text-xl">
            {settings.name}
          </span>
          {headline}
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-white/90 sm:text-lg">
          {settings.hero.description || settings.description}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            onClick={onOffers}
            className="flex h-12 items-center gap-2 rounded-lg bg-brand-green px-6 text-base font-black text-white transition-colors hover:bg-brand-green-hover"
          >
            {settings.hero.ctaLabel || "شوف عروض النهارده"}
          </button>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-6 text-base font-bold text-white transition-colors hover:bg-white/20"
          >
            {settings.hero.whatsappCtaLabel || "اطلب على واتساب"}
          </a>
        </div>
      </div>
    </section>
  );
}
