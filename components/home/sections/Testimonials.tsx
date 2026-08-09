"use client";

import { Quote, Star } from "lucide-react";
import { testimonials } from "@/lib/site";

export function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-4">
      <div className="mb-4 text-center">
        <h2 className="text-xl font-black sm:text-2xl">عملاء سوق الجملة</h2>
        <p className="text-sm text-muted-foreground">آراء العملاء السابقة</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {testimonials.map((t) => (
          <figure
            key={t.id}
            className="relative rounded-2xl border border-border/70 bg-card p-5 shadow-sm"
          >
            <Quote className="absolute left-4 top-4 size-8 text-primary/10" />
            <div className="flex gap-0.5 text-accent" aria-label="تقييم 5 من 5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="size-4 fill-accent text-accent" />
              ))}
            </div>
            <blockquote className="mt-3 text-sm leading-7 text-foreground">
              {t.text}
            </blockquote>
            <figcaption className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
              {t.demo && (
                <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
                  بيانات تجريبية
                </span>
              )}
            </figcaption>
          </figure>
        ))}
      </div>

      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        التقييمات الحالية بيانات تجريبية وسيتم استبدالها بآراء موثوقة من
        العملاء.
      </p>
    </section>
  );
}
