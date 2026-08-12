"use client";

import { useState } from "react";
import {
  TrendingDown,
  Truck,
  Package,
  MessageCircle,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const REASONS = [
  {
    icon: TrendingDown,
    title: "أسعار جملة حقيقية",
    description: "بنبيع بأسعار الجملة للبيت والمحل",
  },
  {
    icon: Truck,
    title: "توصيل لحد الباب",
    description: "نوصل لك في كفر شكر والمناطق المجاورة",
  },
  {
    icon: Package,
    title: "منتجات يومية متنوعة",
    description: "كل اللي محتاجه البيت والمحل في مكان واحد",
  },
  {
    icon: MessageCircle,
    title: "خدمة سريعة على واتساب",
    description: "اطلب في أي وقت وهنرد عليك فوراً",
  },
];

export function WhyUs() {
  // All items start collapsed. Independent toggles: each item can be
  // expanded/collapsed on its own (multiple may be open at once).
  const [openItems, setOpenItems] = useState<boolean[]>(() =>
    REASONS.map(() => false)
  );

  const toggle = (index: number) =>
    setOpenItems((prev) =>
      prev.map((value, i) => (i === index ? !value : value))
    );

  return (
    <section className="site-section py-12" id="why-us">
      <h2 className="mb-8 text-center text-xl font-black sm:text-3xl">
        ليه تشتري من سوق الجملة؟
      </h2>

      {/* Mobile: collapsible accordion — only shown below the sm breakpoint */}
      <div className="overflow-hidden rounded-xl border border-border-default sm:hidden">
        {REASONS.map((reason, index) => {
          const Icon = reason.icon;
          const isOpen = openItems[index];
          return (
            <div
              key={index}
              className="border-b border-border-default last:border-b-0"
            >
              <button
                type="button"
                onClick={() => toggle(index)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-bg-nav-hover"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
                  <Icon className="size-5" />
                </div>
                <h3 className="flex-1 text-sm font-bold text-foreground">
                  {reason.title}
                </h3>
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-md text-text-secondary transition-transform duration-200",
                    isOpen && "rotate-180"
                  )}
                >
                  <ChevronDown className="size-4" />
                </span>
              </button>
              {/* Smooth height transition via grid-template-rows */}
              <div
                className={cn(
                  "grid transition-[grid-template-rows] duration-200 ease-in-out",
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                )}
              >
                <div className="overflow-hidden">
                  <p className="px-4 pb-4 pe-16 text-sm leading-relaxed text-text-secondary">
                    {reason.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: static 4-card grid — only shown at the sm breakpoint and up */}
      <div className="hidden gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-4">
        {REASONS.map((reason, index) => {
          const Icon = reason.icon;
          return (
            <div
              key={index}
              className="flex flex-col items-center rounded-xl border border-border-default bg-bg-surface p-6 text-center shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
                <Icon className="size-7" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-foreground">
                {reason.title}
              </h3>
              <p className="text-sm leading-relaxed text-text-secondary">
                {reason.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}