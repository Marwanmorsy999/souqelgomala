"use client";

import { Minus, Plus, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClientImage } from "@/components/ui/client-image";
import { useStore } from "@/lib/store";
import type { Product } from "@/lib/types";

export function ProductArtwork({
  product,
  large = false,
}: {
  product: Product;
  large?: boolean;
}) {
  const discount = product.oldPrice
    ? Math.max(
        0,
        Math.round(
          ((product.oldPrice - product.retail) / product.oldPrice) * 100,
        ),
      )
    : 0;

  return (
    <ClientImage
      src={product.image_url || product.image}
      alt={product.name}
      eager={large}
      className={`aspect-square w-full ${large ? "rounded-2xl" : "rounded-t-2xl"}`}
      imgClassName="size-full object-contain p-2"
    >
      {discount > 0 && (
        <span className="absolute right-2 top-2 rounded-full bg-destructive px-2 py-1 text-[11px] font-black text-white shadow-sm">
          خصم {discount}%
        </span>
      )}
      <div className="absolute bottom-2 right-2 z-10 rounded-full bg-background/90 px-2 py-1 text-[10px] font-semibold text-foreground shadow-sm backdrop-blur">
        {product.size}
      </div>
      {!product.inStock && (
        <span className="absolute left-2 top-2 z-10 rounded-full bg-background/90 px-2.5 py-1 text-xs font-bold text-destructive shadow-sm">
          نفذت الكمية
        </span>
      )}
    </ClientImage>
  );
}

export function PriceBlock({
  product,
  isWholesale,
}: {
  product: Product;
  isWholesale: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col items-start gap-0.5 text-[13px] leading-tight">
      {/* Retail price with optional discount */}
      <div className="flex flex-wrap items-baseline gap-1.5">
        <span className="font-black text-foreground">{product.retail} ج.م</span>
        {product.oldPrice && (
          <span className="text-xs text-muted-foreground line-through">
            {product.oldPrice} ج.م
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        <span className="font-semibold">جملة:</span> {product.wholesale} ج.م ·{" "}
        {product.size}
      </p>
    </div>
  );
}

type Props = {
  product: Product;
  onOpen: (product: Product) => void;
};

export function ProductCard({ product, onOpen }: Props) {
  const add = useStore((s) => s.add);
  const increment = useStore((s) => s.increment);
  const decrement = useStore((s) => s.decrement);
  const isWholesale = useStore((s) => s.isWholesale);
  const quantity = useStore(
    (s) => s.cart.find((i) => i.id === product.id)?.quantity ?? 0,
  );

  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
      <Card className="group flex h-full flex-col overflow-hidden border-border/70 bg-card shadow-sm transition-shadow hover:shadow-md">
        <CardContent className="flex flex-col gap-0 p-0">
          <button
            className="text-right"
            onClick={() => onOpen(product)}
            aria-label={`عرض ${product.name}`}
          >
            <ProductArtwork product={product} />
          </button>
          <div className="flex flex-1 flex-col gap-2.5 p-3">
            <div className="min-w-0 text-right">
              {product.brand && (
                <p className="text-[10px] font-bold text-primary">
                  {product.brand}
                </p>
              )}
              <p className="truncate font-bold text-foreground">
                {product.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {product.english}
              </p>
            </div>

            <div className="mt-auto flex flex-col gap-2.5">
              <PriceBlock product={product} isWholesale={isWholesale} />

              {quantity === 0 ? (
                <Button
                  size="sm"
                  disabled={!product.inStock}
                  onClick={() => add(product.id)}
                  aria-label={
                    !product.inStock
                      ? `${product.name} نفذت الكمية`
                      : `أضف ${product.name} للسلة`
                  }
                  className="h-10 w-full gap-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <ShoppingCart className="size-4" />
                  أضف للسلة
                </Button>
              ) : (
                <div className="flex h-10 w-full items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-1.5">
                  <button
                    onClick={() => decrement(product.id)}
                    aria-label={`إنقاص ${product.name}`}
                    className="flex size-8 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary/10"
                  >
                    <Minus className="size-4" />
                  </button>
                  <span className="min-w-5 text-center text-sm font-black text-primary">
                    {quantity}
                  </span>
                  <button
                    onClick={() => increment(product.id)}
                    aria-label={`زيادة ${product.name}`}
                    className="flex size-8 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary/10"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
