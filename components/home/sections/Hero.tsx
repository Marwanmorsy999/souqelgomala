"use client";

import { BadgeCheck, Package, Store, Truck } from "lucide-react";
import { SITE } from "@/lib/site";
import { heroImage } from "@/lib/data";

type Props = {
  onShop: () => void;
  onOffers: () => void;
};

export function Hero({ onShop, onOffers }: Props) {
  return (
    <section id="home" className="relative overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="سوبرماركت سوق الجملة — رفوف منتجات غذائية"
          className="size-full object-cover object-center"
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/25" />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/20" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 sm:pt-20 md:pb-24 md:pt-28">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold text-white backdrop-blur">
          <Store className="size-4" />
          سوق الجملة — كفر شكر، القليوبية
        </span>

        <h1 className="mt-5 max-w-2xl text-4xl font-black leading-[1.15] text-white sm:text-5xl md:text-6xl">
          {SITE.tagline}
        </h1>

        <p className="mt-4 max-w-md text-base leading-7 text-white/90 sm:text-lg">
          بقالة جملة وقطاعي — مواد غذائية ومنتجات منزلية بأسعار الجملة، تشكيلة
          كبيرة تناسب البيت والمحل.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            onClick={onShop}
            className="h-12 rounded-2xl bg-accent px-8 text-base font-black text-accent-foreground shadow-lg shadow-black/20 transition-transform hover:scale-[1.02] active:scale-95"
          >
            تسوق الآن
          </button>
          <button
            onClick={onOffers}
            className="h-12 rounded-2xl border border-white/40 bg-white/10 px-6 text-base font-bold text-white backdrop-blur transition-colors hover:bg-white/20"
          >
            شوف العروض
          </button>
        </div>

        <div className="mt-10 flex flex-wrap gap-2.5" aria-label="مميزات">
          {[
            { icon: BadgeCheck, label: "أسعار جملة" },
            { icon: Truck, label: "توصيل محلي" },
            { icon: Package, label: "تشكيلة كبيرة" },
          ].map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="flex items-center gap-1.5 rounded-full bg-black/30 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur"
            >
              <Icon className="size-4" />
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
