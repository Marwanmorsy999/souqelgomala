"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Heart, Minus, Package, Plus, Share2, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { getProducts } from "@/lib/services/catalog";
import { hasProductImage, packageLabel } from "@/lib/utils";
import { ProductCard } from "./ProductCard";
import ProductJsonLd from "./ProductJsonLd";
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
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState<"الوصف" | "التغذية" | "التقييمات">(
    "الوصف",
  );
  const [liked, setLiked] = useState(false);
  const [pointerStart, setPointerStart] = useState<number | null>(null);
  const [related, setRelated] = useState<Product[]>([]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [product.id]);

  useEffect(() => {
    let active = true;
    getProducts()
      .then((all) => {
        if (!active) return;
        setRelated(all.filter((p) => p.id !== product.id).slice(0, 4));
      })
      .catch(() => {
        /* ignore related-load failures */
      });
    return () => {
      active = false;
    };
  }, [product.id]);

  const price = isWholesale ? product.wholesale : product.retail;
  const total = price * quantity;
  const gallery = [product.image];

  const changeImage = (dir: number) =>
    setActiveImage((curr) => (curr + dir + gallery.length) % gallery.length);

  const tabContent = {
    الوصف:
      "اختيار عملي بجودة ممتازة من سوق الجملة، مناسب للبيت والمحل ويصل إليك طازجاً مع كل طلب.",
    التغذية: "تفاصيل التغذية والمكونات موضحة على العبوة.",
    التقييمات: "آراء موثوقة من عملاء سوق الجملة.",
  };

  return (
    <main className="min-h-screen bg-background pb-28" dir="rtl">
      <ProductJsonLd product={product} />
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="رجوع">
          <ArrowRight className="size-5" />
        </Button>
        <h1 className="text-base font-black">تفاصيل المنتج</h1>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLiked((v) => !v)}
            aria-label="المفضلة"
          >
            <Heart
              className={`size-5 ${liked ? "fill-destructive text-destructive" : ""}`}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (navigator.share)
                navigator
                  .share({
                    title: product.name,
                    text: `شوف ${product.name} في سوق الجملة`,
                  })
                  .catch(() => undefined);
            }}
            aria-label="مشاركة"
          >
            <Share2 className="size-5" />
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-4">
        {/* Gallery */}
        <section className="relative overflow-hidden rounded-3xl bg-muted">
          <div
            className="flex touch-pan-x snap-x snap-mandatory overflow-hidden"
            onPointerDown={(e) => setPointerStart(e.clientX)}
            onPointerUp={(e) => {
              if (pointerStart === null) return;
              const dist = e.clientX - pointerStart;
              if (Math.abs(dist) > 45) changeImage(dist > 0 ? 1 : -1);
              setPointerStart(null);
            }}
          >
            {hasProductImage(product) ? (
              <img
                src={gallery[activeImage]}
                alt={`${product.name} صورة ${activeImage + 1}`}
                className="aspect-square w-full snap-center object-cover"
              />
            ) : (
              <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary/10 via-card to-accent/10">
                <Package className="size-12 text-primary/40" />
                <p className="px-6 text-center font-black">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {packageLabel(product)} — منتجات سوق الجملة
                </p>
              </div>
            )}
          </div>
          {!product.inStock && (
            <span className="absolute right-3 top-3 rounded-full bg-destructive px-3 py-1.5 text-xs font-bold text-destructive-foreground">
              نفذت الكمية
            </span>
          )}
          {hasProductImage(product) && (
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-background/80 px-2.5 py-1.5">
              {gallery.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  aria-label={`الصورة ${i + 1}`}
                  className={`size-2 rounded-full transition ${activeImage === i ? "bg-primary" : "bg-muted-foreground/40"}`}
                />
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-4 py-5">
          {/* Name + product facts (no invented brands/reviews) */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">{product.name}</h2>
                <p className="text-[13px] text-muted-foreground">
                  {product.english}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0">
                {product.brand || product.category || "سوق الجملة"}
              </Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                <Package className="size-3.5" />
                {packageLabel(product)}
              </span>
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
                الدفع كاش عند الاستلام
              </span>
            </div>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-muted px-3 py-2.5">
              <p className="text-[11px] text-muted-foreground">سعر القطاعي</p>
              <p className="mt-1 text-sm font-bold text-muted-foreground">
                {product.retail} ج.م
              </p>
            </div>
            <div className="rounded-2xl bg-primary/10 px-3 py-2.5">
              <p className="text-[11px] text-primary">سعر الجملة</p>
              <p className="mt-1 flex items-center gap-1 text-sm font-black text-primary">
                <Store className="size-4" />
                {isWholesale ? `${product.wholesale} ج.م` : "سجل لرؤية السعر"}
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge
              className={
                !product.inStock
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-primary text-primary-foreground"
              }
            >
              {!product.inStock ? "نفذت الكمية ✗" : "متوفر ✓"}
            </Badge>
            <Badge variant="secondary">{product.size}</Badge>
          </div>

          {/* Tabs */}
          <div className="flex border-b">
            {(["الوصف", "التغذية", "التقييمات"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 border-b-2 py-3 text-sm font-bold transition-colors ${activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <p className="min-h-12 text-sm leading-7 text-muted-foreground">
            {tabContent[activeTab]}
          </p>

          {/* Quantity */}
          <div className="flex items-center justify-center gap-5 rounded-2xl bg-muted p-2">
            <Button
              variant="ghost"
              size="icon"
              className="size-10 rounded-xl"
              disabled={quantity === 1}
              onClick={() => setQuantity((v) => Math.max(1, v - 1))}
            >
              <Minus className="size-4" />
            </Button>
            <span className="min-w-8 text-center text-lg font-black">
              {quantity}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-10 rounded-xl"
              disabled={!product.inStock}
              onClick={() => setQuantity((v) => v + 1)}
            >
              <Plus className="size-4" />
            </Button>
          </div>

          {/* Related */}
          <section>
            <h3 className="mb-3 text-lg font-black">منتجات مشابهة</h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {related.map((item) => (
                <div key={item.id} className="min-w-36">
                  <ProductCard product={item} onOpen={onSelect} />
                </div>
              ))}
            </div>
          </section>
        </section>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t bg-background/95 p-3 shadow-2xl backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">الإجمالي</p>
            <p className="text-lg font-black text-primary">{total} ج.م</p>
          </div>
          <Button
            disabled={!product.inStock}
            onClick={() => {
              add(product.id);
              onBack();
            }}
            className="h-12 flex-1 rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90"
          >
            أضف للسلة
          </Button>
        </div>
      </div>
    </main>
  );
}
