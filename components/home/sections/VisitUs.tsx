"use client";

import { MapPin } from "lucide-react";

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
          <div className="flex flex-col justify-center p-8 text-center md:text-right">
            <div className="mb-4 inline-flex items-center justify-center gap-2 rounded-full bg-brand-green/10 px-4 py-2 text-sm font-bold text-brand-green md:justify-start self-center md:self-start">
              <MapPin className="size-4" />
              <span>من قلب كفر شكر</span>
            </div>
            <h2 className="mb-3 text-2xl font-black text-foreground sm:text-3xl">زورونا في الفرع</h2>
            <p className="text-lg leading-relaxed text-text-secondary">
              خلف مسجد آل عطا الله، ميدان كفر شكر
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
