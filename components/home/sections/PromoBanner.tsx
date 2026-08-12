"use client";

import { MessageCircle, Phone, ShoppingCart } from "lucide-react";
import { telMain } from "@/lib/site";

/**
 * Final contact / support CTA — sits just before the footer.
 *
 * Phone and WhatsApp are for inquiries and complaints ONLY; orders are placed
 * through the website cart + checkout. The main action takes the customer to
 * the shop so they can keep ordering on the site.
 */
export function PromoBanner({ onBrowse }: { onBrowse: () => void }) {
  return (
    <section id="contact" className="site-section scroll-mt-20">
      <div className="flex flex-col gap-6 rounded-xl bg-primary p-6 text-primary-foreground sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <h2 className="text-2xl font-black leading-tight sm:text-3xl">
            عايز تطلب؟ سهّلناها عليك من الموقع
          </h2>
          <p className="mt-2 text-sm leading-7 text-primary-foreground/85">
            أضف المنتجات للسلة واتمم طلبك من الموقع خلال ثواني — الدفع كاش عند
            الاستلام.
          </p>

          <div className="mt-4 flex flex-col gap-2 text-sm">
            <p className="flex items-center gap-2 text-primary-foreground/70">
              <MessageCircle className="size-4 shrink-0 text-accent" />
              للاستفسارات والشكاوى فقط — الطلبات تتم عن طريق الموقع
            </p>
            <p className="flex items-center gap-2 text-primary-foreground/70">
              <Phone className="size-4 shrink-0 text-accent" />
              مواعيد العمل: يومياً من 9 صباحاً حتى 11 مساءً
            </p>
            <p className="text-xs text-primary-foreground/60">
              خلف مسجد آل عطا الله — ميدان كفر شكر
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <button
            onClick={onBrowse}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-accent px-6 font-black text-accent-foreground transition-colors hover:bg-accent/90"
          >
            <ShoppingCart className="size-5" />
            تصفح المنتجات
          </button>
          <a
            href={telMain}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 font-bold text-white transition-colors hover:bg-white/20"
          >
            <Phone className="size-5 text-accent" />
            <span dir="ltr">01222464999</span>
          </a>
        </div>
      </div>
    </section>
  );
}
