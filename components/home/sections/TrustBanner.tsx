import { BadgeCheck, HandCoins, ShieldCheck } from "lucide-react";

export function TrustBanner() {
  return (
    <section className="mx-auto max-w-6xl px-4">
      <div className="relative overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground sm:p-8">
        <div
          className="absolute -left-10 -top-10 size-44 rounded-full bg-white/5"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-16 right-10 size-52 rounded-full bg-white/5"
          aria-hidden="true"
        />

        <div className="relative grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-black text-accent-foreground">
              <BadgeCheck className="size-4" /> سوق مصري محلي موثوق
            </span>
            <h2 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">
              سعر الجملة وجودة تثق فيها
            </h2>
            <p className="mt-3 max-w-md text-sm leading-7 text-primary-foreground/85">
              منتجات أصلية وتشكيلة واسعة من المواد الغذائية والمنتجات المنزلية
              بأسعار جملة تناسب العيلة المصرية والتجار وأصحاب المحلات.
            </p>
          </div>

          <ul className="flex flex-col gap-3">
            {[
              {
                icon: BadgeCheck,
                title: "منتجات أصلية",
                text: "بنعرض تشكيلة متنوعة بجودة موثوقة.",
              },
              {
                icon: HandCoins,
                title: "أسعار جملة وقطاعي",
                text: "أسعار مناسبة للشراء بالحبة أو بالكرتون.",
              },
              {
                icon: ShieldCheck,
                title: "محل محلي في كفر شكر",
                text: "سهل توصلنا ومتاحين للاستفسار.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <li
                key={title}
                className="flex items-start gap-3 rounded-2xl bg-white/10 p-3 backdrop-blur"
              >
                <Icon className="mt-0.5 size-5 shrink-0 text-accent" />
                <div>
                  <p className="text-sm font-bold">{title}</p>
                  <p className="text-xs text-primary-foreground/80">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
