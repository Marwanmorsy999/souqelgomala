"use client";

import { TrendingDown, Truck, Package, MessageCircle } from "lucide-react";

export function WhyUs() {
  const reasons = [
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

  return (
    <section className="site-section py-12" id="why-us">
      <h2 className="mb-8 text-center text-2xl font-black sm:text-3xl">
        ليه تشتري من سوق الجملة؟
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {reasons.map((reason, i) => {
          const Icon = reason.icon;
          return (
            <div
              key={i}
              className="flex flex-col items-center rounded-xl border border-border-default bg-bg-surface p-6 text-center shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
                <Icon className="size-7" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-foreground">{reason.title}</h3>
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
