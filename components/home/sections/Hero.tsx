"use client";

import type { CSSProperties } from "react";
import { useSiteSettings } from "@/components/shared/site-settings";

type Props = {
  onOffers: () => void;
  onBrowse: () => void;
};

/** Real shop photo — rendered as `background-image` behind the dark-green overlay. */
const HERO_PHOTO = "/hero.jpg";

/**
 * Stats shown below the hero CTA buttons. Values are grounded in existing site
 * data (7000+ products, 14 homepage categories, 6 featured brands).
 */
const HERO_STATS = [
  { value: "7000", accent: "+", label: "منتج جملة وقطاعي" },
  { value: "14", accent: "+", label: "قسم رئيسي" },
  { value: "6", accent: "+", label: "علامة تجارية" },
];

/**
 * Hero — the سوق الجملة identity block.
 *
 * Full-bleed photo (`public/hero.jpg`) sits behind a dark-green gradient overlay
 * (defined in `.hero-photo`). Every piece of copy (business name, headline,
 * description, CTA labels) stays admin-managed via the settings dashboard
 * (D1-backed with the existing lib/site.ts defaults). The text block sits on the
 * RIGHT in a max-w-[560px] container, left-aligned, hugging the right edge.
 */
export function Hero({ onOffers, onBrowse }: Props) {
  const settings = useSiteSettings();
  const photo = settings.hero.image?.trim() || HERO_PHOTO;
  const headline = settings.hero.title?.trim() || settings.tagline;

  return (
    <section
      id="home"
      className="hero-photo relative overflow-hidden"
      style={{ "--hero-photo": `url("${photo}")` } as CSSProperties}
    >
      <div className="relative flex min-h-[440px] flex-col justify-center py-[60px] sm:min-h-[500px] md:min-h-[560px] lg:min-h-[620px]">
        {/* Right-aligned text column (RTL start side) — max 560px, left-aligned */}
        <div className="ml-auto flex w-full max-w-[560px] flex-col px-10 text-left">
          <h1 className="text-2xl font-black leading-[1.25] text-white sm:text-4xl md:text-5xl">
            <span className="mb-3 block text-base font-black tracking-wide text-brand-green-light sm:text-xl">
              {settings.name}
            </span>
            {headline}
          </h1>

          <p className="mt-4 text-base font-medium leading-6 text-white/90 sm:text-lg">
            {settings.hero.description || settings.description}
          </p>

          {/* CTA buttons — aligned right, colors & labels unchanged */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <button
              onClick={onBrowse}
              className="flex h-12 w-full items-center justify-center gap-1.5 rounded-lg bg-brand-green px-6 text-base font-black text-white transition-colors hover:bg-brand-green-hover button-glow sm:w-auto"
            >
              {settings.hero.ctaLabel &&
              settings.hero.ctaLabel !== "شوف عروض النهارده"
                ? settings.hero.ctaLabel
                : "تصفح المنتجات"}
            </button>
            <button
              onClick={onOffers}
              className="flex h-12 w-full items-center justify-center gap-1.5 rounded-lg border border-white/30 bg-white/10 px-6 text-base font-bold text-white transition-colors hover:bg-white/20 sm:w-auto"
            >
              شوف عروض النهارده
            </button>

            <div className="flex items-center gap-2 text-white/90">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              <span className="text-sm font-medium">خلف مسجد آل عطا الله، ميدان كفر شكر</span>
            </div>
          </div>

          {/* Stats row — top border separator, numbers + labels */}
          <div className="mt-8 flex items-center gap-10 border-t border-white/10 pt-6 sm:gap-12">
            {HERO_STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col">
                <span className="text-[22px] font-black leading-none text-white">
                  {stat.value}
                  <span className="text-brand-green-light">{stat.accent}</span>
                </span>
                <span className="mt-1.5 text-[11px] font-medium text-white/45">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
