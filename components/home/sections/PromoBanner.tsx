"use client";

import { MapPin, MessageCircle, Phone } from "lucide-react";
import { SITE, telMain, waLink } from "@/lib/site";

/**
 * Final contact / order CTA — sits just before the footer.
 *
 * The whole page funnels here: → checkout on the website or confirm on
 * WhatsApp/phone, exactly like the existing daily social workflow.
 */
export function PromoBanner() {
  return (
    <section id="contact" className="mx-auto max-w-6xl scroll-mt-20 px-4">
      <div className="relative overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground sm:p-8">
        <div
          className="absolute -left-12 -top-12 size-44 rounded-full bg-white/5"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-16 right-8 size-56 rounded-full bg-accent/25 blur-2xl"
          aria-hidden="true"
        />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <h2 className="text-2xl font-black leading-tight sm:text-3xl">
              جاهز تطلب من سوق الجملة؟ 📞
            </h2>
            <p className="mt-2 text-sm leading-7 text-primary-foreground/85">
              ابعت طلبك على الواتساب أو كلمنا مباشرة، هنأكده معاك ونوصله لحد باب
              البيت في كفر شكر والمناطق المجاورة — الدفع كاش عند الاستلام.
            </p>
            <p className="mt-3 flex items-start gap-1.5 text-sm text-primary-foreground/90">
              <MapPin className="mt-0.5 size-4 shrink-0 text-accent" />
              {SITE.location}
              <span className="text-primary-foreground/70">—</span>
              <span className="text-primary-foreground/70">
                شارع جمال عبد الناصر، ميدان كفر شكر
              </span>
            </p>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-accent px-6 font-black text-accent-foreground shadow-lg shadow-black/10 transition-transform hover:scale-[1.02] active:scale-95"
            >
              <MessageCircle className="size-5" />
              اطلب واتساب
            </a>
            <a
              href={telMain}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-5 font-bold text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              <Phone className="size-5 text-accent" />
              <span dir="ltr">{SITE.phoneMain}</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
