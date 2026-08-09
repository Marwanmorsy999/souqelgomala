"use client";

import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { getProducts } from "@/lib/services/catalog";
import { hasProductImage, productImageSrc } from "@/lib/utils";
import ProductJsonLd from "./ProductJsonLd";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/lib/types";

type Props = {
  product: Product;
  isWholesale: boolean;
  onBack: () => void;
  onSelect: (product: Product) => void;
};

export function ProductDetail({
  product,
  isWholesale,
  onBack,
  onSelect,
}: Props) {
  const add = useStore((s) => s.add);
  const [quantity, setQuantity] = useState(1);
  const [related, setRelated] = useState<Product[]>([]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [product.id]);

  useEffect(() => {
    let active = true;
    getProducts()
      .then((all) => {
        if (!active) return;
        setRelated(all.filter((p) => p.id !== product.id).slice(0, 6));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [product.id]);

  const price = isWholesale ? product.wholesale : product.retail;
  const total = price * quantity;

  return (
    <main className="min-h-screen bg-background pb-24" dir="rtl">
      <ProductJsonLd product={product} />
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/95 px-4 py-3">
        <button
          onClick={onBack}
          aria-label="رجوع"
          className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-muted"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-base font-black">تفاصيل المنتج</h1>
        <span className="size-9" />
      </header>

      <div className="mx-auto max-w-3xl px-4 py-5">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="overflow-hidden rounded-xl bg-muted">
            {hasProductImage(product) ? (
              <img
                src={productImageSrc(product)}
                alt={product.name}
                className="size-full object-contain"
              />
            ) : (
              <div className="flex aspect-square items-center justify-center p-6 text-center text-sm text-muted-foreground">
                {product.name}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-xl font-black">{product.name}</p>
            <p className="text-sm text-muted-foreground">
              {product.size && product.size.trim() ? product.size : "حبة"}
            </p>

            <div className="flex flex-wrap items-baseline gap-x-3">
              <span className="text-2xl font-black text-foreground">
                {price} ج.م
              </span>
              {product.oldPrice && product.oldPrice > product.retail && (
                <span className="text-sm text-muted-foreground line-through">
                  {product.oldPrice} ج.م
                </span>
              )}
            </div>

            {product.brand && (
              <p className="text-xs text-muted-foreground">
                الماركة: {product.brand}
              </p>
            )}

            <div className="mt-2 flex items-center justify-between rounded-xl border border-border p-2">
              <span className="text-xs text-muted-foreground">الكمية</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity((v: number) => Math.max(1, v - 1))}
                  className="flex size-8 items-center justify-center rounded-lg transition-colors hover:bg-muted"
                >
                  <Minus className="size-4" />
                </button>
                <span className="min-w-6 text-center text-sm font-black">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((v: number) => v + 1)}
                  className="flex size-8 items-center justify-center rounded-lg transition-colors hover:bg-muted"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                add(product.id);
                onBack();
              }}
              className="mt-1 flex h-12 w-full items-center justify-center rounded-xl bg-primary text-base font-black text-primary-foreground transition-colors hover:bg-primary/90"
            >
              أضف للسلة — {total} ج.م
            </button>
          </div>
        </div>

        {product.description && (
          <div className="mt-8">
            <h2 className="mb-2 text-lg font-black">الوصف</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              {product.description}
            </p>
          </div>
        )}

        {related.length > 0 && (
          <section className="mt-8">
            <h3 className="mb-3 text-lg font-black">منتجات مشابهة</h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {related.map((item: Product) => (
                <div key={item.id} className="min-w-36">
                  <ProductCard product={item} onOpen={onSelect} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}