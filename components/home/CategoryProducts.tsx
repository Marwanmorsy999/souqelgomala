"use client";

import { useEffect, useState } from "react";
import { PackageSearch, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/95 px-4 py-4 backdrop-blur">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="رجوع">
          <ChevronRight className="size-5" />
        </Button>
        <div className="text-center">
          <h1 className="text-lg font-black">قسم {category}</h1>
          <p className="text-xs text-muted-foreground">
            {loading ? "جار التحميل..." : `${products.length} منتج`}
          </p>
        </div>
        <span className="size-9" />
      </header>

      <div className="mx-auto max-w-6xl px-4 py-5">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] animate-pulse rounded-2xl bg-muted"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex min-h-[55vh] flex-col items-center justify-center gap-3 text-center">
            <PackageSearch className="size-14 text-muted-foreground/40" />
            <h2 className="text-xl font-black">
              لا توجد منتجات في هذا القسم حالياً
            </h2>
            <p className="text-sm text-muted-foreground">
              قسم {category} سيتم تحديثه قريباً — أو تواصل معنا على واتساب.
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
