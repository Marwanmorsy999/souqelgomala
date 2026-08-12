"use client";

import { MapPin, MessageCircle, Phone, Clock } from "lucide-react";
import { telMain, telAlt } from "@/lib/site";

export function VisitUs() {
  return (
    <section className="site-section py-10" id="visit">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-border-default bg-bg-surface shadow-sm">
        <div className="grid md:grid-cols-2">
          {/* Video Player */}
          <div className="relative aspect-video md:aspect-auto">
            <video
              src="/store.mp4"
              controls
              muted
              className="size-full object-cover"
              preload="metadata"
            />
          </div>
          {/* Address Info */}
          <div className="flex flex-col justify-center gap-4 p-8 text-center md:text-right">
            <div className="mb-1 inline-flex items-center justify-center gap-2 rounded-full bg-brand-green/10 px-4 py-2 text-sm font-bold text-brand-green md:justify-start self-center md:self-start">
              <MapPin className="size-4" />
              <span>من قلب كفر شكر</span>
            </div>
            <h2 className="text-2xl font-black text-foreground sm:text-3xl">
              زورونا في الفرع
            </h2>
            <p className="text-lg font-medium leading-relaxed text-text-secondary">
              خلف مسجد آل عطا الله — ميدان كفر شكر
            </p>

            <div className="flex flex-col gap-2 text-sm">
              <a
                href={telMain}
                className="flex items-center justify-center gap-2 text-text-secondary transition-colors hover:text-brand-green md:justify-start"
              >
                <Phone className="size-4 text-brand-green" />
                <span dir="ltr">01222464999</span>
              </a>
              <a
                href={telAlt}
                className="flex items-center justify-center gap-2 text-text-secondary transition-colors hover:text-brand-green md:justify-start"
              >
                <Phone className="size-4 text-brand-green" />
                <span dir="ltr">01090787378</span>
              </a>
              <p className="flex items-center justify-center gap-2 text-text-secondary md:justify-start">
                <Clock className="size-4 text-brand-green" />
                مواعيد العمل: يومياً من 9 صباحاً حتى 11 مساءً
              </p>
              <p className="flex items-center justify-center gap-2 text-text-muted md:justify-start">
                <MessageCircle className="size-4 text-brand-green" />
                للاستفسارات والشكاوى فقط — الطلبات تتم عن طريق الموقع
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
