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

      <div className="site-section relative pb-10 pt-8 sm:pb-20 sm:pt-20 md:pb-24 md:pt-28">
        <h1 className="max-w-2xl text-2xl font-black leading-[1.25] text-white sm:text-4xl md:text-5xl">
          <span className="mb-3 block text-base font-black tracking-wide text-brand-green-light sm:text-xl">
            {settings.name}
          </span>
          {headline}
        </h1>
        <p className="mt-4 max-w-xl text-base font-medium leading-6 text-white/90 sm:text-lg">
          {settings.hero.description || settings.description}
        </p>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-3">
          <div className="flex w-full flex-row gap-2 sm:w-auto sm:flex-wrap sm:gap-3">
            <button
              onClick={onOffers}
              className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/30 bg-white/10 px-2 text-sm font-bold text-white transition-colors hover:bg-white/20 sm:flex-none sm:justify-start sm:px-6 sm:text-base sm:gap-2"
            >
              {settings.hero.ctaLabel || "شوف عروض النهارده"}
            </button>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-green px-2 text-sm font-black text-white transition-colors hover:bg-brand-green-hover button-glow sm:flex-none sm:justify-start sm:px-6 sm:text-base sm:gap-2"
            >
              {settings.hero.whatsappCtaLabel || "اطلب على واتساب"}
            </a>
          </div>
          
          <div className="flex items-center gap-2 text-white/90">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            <span className="text-sm font-medium">خلف مسجد آل عطا الله، ميدان كفر شكر</span>
          </div>
        </div>
      </div>
    </section>
  );
}