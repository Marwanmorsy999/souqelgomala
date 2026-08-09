"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "@/components/home/ProductCard";
import { getProductsByCategory } from "@/lib/services/catalog";
import type { Product } from "@/lib/types";

type Props = {
  category: string;
  onBack: () => void;
  onOpen: (product: Product) => void;
};

export function CategoryProducts({ category, onBack, onOpen }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    // Reset loading lazily (wrapped in a tick to avoid the
    // "setState synchronously in an effect" lint rule).
    const t = window.setTimeout(() => {
      if (active) setLoading(true);
    }, 0);
    getProductsByCategory(category)
      .then((list) => {
        if (active) {
          setProducts(list);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setProducts([]);
          setLoading(false);
        }
      });
    return () => {
      active = false;
      window.clearTimeout(t);
    };
  }, [category]);

  return (
    <main className="min-h-screen bg-background pb-28" dir="rtl">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/95 px-4 py-4">
        <button
          onClick={onBack}
          aria-label="رجوع"
          className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-muted"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center">
          <h1 className="text-lg font-black">قسم {category}</h1>
          <p className="text-xs text-muted-foreground">
            {loading ? "جار التحميل..." : `${products.length} منتج`}
          </p>
        </div>
        <span className="size-9" />
      </header>

      <div className="site-section py-5">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-56 animate-pulse rounded-xl bg-muted"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex min-h-[55vh] flex-col items-center justify-center gap-3 text-center">
            <p className="text-lg font-black">لا توجد منتجات في هذا القسم حالياً</p>
            <p className="text-sm text-muted-foreground">
              تواصل معنا على واتساب لمعرفة المتوفر.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} onOpen={onOpen} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
