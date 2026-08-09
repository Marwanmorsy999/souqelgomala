"use client";

import { MessageCircle, Phone, Truck } from "lucide-react";
import { SITE, telMain, waLink } from "@/lib/site";

export function PromoBanner() {
  return (
    <section id="offers" className="mx-auto max-w-6xl px-4">
      <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
        <div className="relative flex flex-col gap-5 bg-gradient-to-l from-primary/10 to-transparent p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Truck className="size-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-primary">
                اطلب دلوقتي وخلي طلبك يوصلك
              </p>
              <h2 className="mt-1 text-xl font-black sm:text-2xl">
                للطلب والاستفسار تواصل معنا
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                متوفرين لخدمتك في كفر شكر والمناطق المجاورة.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={telMain}
              className="flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-bold text-foreground transition-colors hover:bg-muted"
            >
              <Phone className="size-4 text-primary" />
              <span dir="ltr">{SITE.phoneMain}</span>
            </a>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <MessageCircle className="size-4" />
              اطلب واتساب
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
