"use client";

import { MessageCircle, Phone } from "lucide-react";
import { SITE, telMain, waLink } from "@/lib/site";

/**
 * Final contact / order CTA — sits just before the footer.
 *
 * The whole page funnels here: → checkout on the website or confirm on
 * WhatsApp/phone, exactly like the existing daily social workflow.
 */
export function PromoBanner() {
  return (
    <section id="contact" className="site-section scroll-mt-20">
      <div className="flex flex-col gap-6 rounded-xl bg-primary p-6 text-primary-foreground sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <h2 className="text-2xl font-black leading-tight sm:text-3xl">
            {SITE.name} — جاهز تطلب؟
          </h2>
          <p className="mt-2 text-sm leading-7 text-primary-foreground/85">
            ابعت طلبك على الواتساب أو كلمنا مباشرة هنأكده معاك ونوصله لحد باب
            البيت في كفر شكر والمناطق المجاورة.
          </p>
          <p className="mt-2 text-sm text-primary-foreground/70">
            {SITE.location} — الدفع كاش عند الاستلام
          </p>
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-accent px-6 font-black text-accent-foreground transition-colors hover:bg-accent/90"
          >
            <MessageCircle className="size-5" />
            اطلب واتساب
          </a>
          <a
            href={telMain}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 font-bold text-white transition-colors hover:bg-white/20"
          >
            <Phone className="size-5 text-accent" />
            <span dir="ltr">{SITE.phoneMain}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
