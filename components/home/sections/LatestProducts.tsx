"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { getLatest, getBestSelling } from "@/lib/services/catalog";
import { ProductCard } from "@/components/home/ProductCard";
import type { Product } from "@/lib/types";

type Props = { onOpen: (product: Product) => void };

export function LatestProducts({ onOpen }: Props) {
  const [latest, setLatest] = useState<Product[]>([]);
  const [best, setBest] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([getLatest(), getBestSelling()])
      .then(([l, b]) => {
        if (!active) return;
        setLatest(l);
        setBest(b);
      })
      .catch(() => {
        /* catalog unavailable — show nothing gracefully */
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  // Unique products: best-sellers first, then newer arrivals not yet shown.
  const all = [
    ...best,
    ...latest.filter((p) => !best.some((b) => b.id === p.id)),
  ].slice(0, 8);

  return (
    <section id="products" className="mx-auto max-w-6xl scroll-mt-20 px-4">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-black sm:text-2xl">🔥 الأكثر طلبًا</h2>
          <p className="text-sm text-muted-foreground">
            الأصناف اللي بتخلص الأول من المحل
          </p>
        </div>
        <button
          onClick={() => document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" })}
          className="hidden items-center gap-1 text-sm font-bold text-primary transition-colors hover:text-primary/80 md:flex"
        >
          تصفح الأقسام
          <ArrowLeft className="size-4" />
        </button>
      </div>

      {/* Mobile: horizontal scroll · Desktop: responsive grid */}
      <div className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] w-44 shrink-0 snap-start animate-pulse rounded-2xl bg-muted md:w-auto"
              />
            ))
          : all.map((p) => (
              <div key={p.id} className="w-44 shrink-0 snap-start md:w-auto">
                <ProductCard product={p} onOpen={onOpen} />
              </div>
            ))}
      </div>
    </section>
  );
}
