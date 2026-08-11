"use client";

import { useEffect, useState } from "react";
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
    <section id="products" className="site-section scroll-mt-20">
      <div className="mb-4">
        <h2 className="text-xl font-black sm:text-2xl">منتجات سوق الجملة</h2>
        <p className="mt-1 text-sm text-text-secondary">
          الأكثر طلبًا والأحدث على رفوف المحل
        </p>
      </div>

      {/* Mobile: horizontal swipe · Desktop: static grid */}
      <div className="-mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-2 sm:-mx-4 sm:px-4 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-56 w-44 shrink-0 animate-pulse rounded-lg bg-bg-surface md:w-auto"
              />
            ))
          : all.map((p) => (
              <div key={p.id} className="w-48 shrink-0 snap-start md:w-auto">
                <ProductCard product={p} onOpen={onOpen} />
              </div>
            ))}
      </div>
    </section>
  );
}
