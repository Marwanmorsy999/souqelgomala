import { BadgeCheck, HandCoins, Truck } from "lucide-react";
import { storeFeatures } from "@/lib/site";

const iconMap = {
  wholesale: HandCoins,
  delivery: Truck,
  secure: BadgeCheck,
} as const;

export function StoreFeatures() {
  return (
    <section className="mx-auto max-w-6xl px-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {storeFeatures.map((f) => {
          const Icon = iconMap[f.id as keyof typeof iconMap] ?? BadgeCheck;
          return (
            <div
              key={f.id}
              className="flex flex-col items-center gap-3 rounded-2xl border border-border/70 bg-card p-6 text-center shadow-sm"
            >
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="size-7" />
              </div>
              <h3 className="text-base font-black">{f.title}</h3>
              <p className="text-sm leading-6 text-muted-foreground">
                {f.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
