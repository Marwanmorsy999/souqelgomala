"use client";

import { Minus, Package, Plus, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClientImage } from "@/components/ui/client-image";
import { useStore } from "@/lib/store";
import {
  cn,
  discountPercent,
  formatPrice,
  hasProductImage,
  packageLabel,
  productImageSrc,
} from "@/lib/utils";
import type { Product } from "@/lib/types";

/**
 * Product artwork — image-aware.
 *
 * WITH a real photo     → the photo (discount badge + package pill).
 * WITHOUT a photo       → a compact branded tile — NEVER a giant gray box.
 * The card body always carries the name / price / package / CTA.
 */
export function ProductArtwork({
  product,
  large = false,
}: {
  product: Product;
  large?: boolean;
}) {
  if (!hasProductImage(product)) {
    return (
      <div
        className={cn(
          "flex aspect-[4/3] flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-primary/10 via-card to-accent/10",
          large ? "aspect-square rounded-2xl" : "rounded-t-2xl",
        )}
      >
        <Package className="size-8 text-primary/45" />
        <span className="text-[11px] font-bold text-muted-foreground">
          {packageLabel(product)}
        </span>
      </div>
    );
  }

  const discount = discountPercent(product);

  return (
    <ClientImage
      src={productImageSrc(product)}
      alt={product.name}
      eager={large}
      className={`aspect-square w-full ${large ? "rounded-2xl" : "rounded-t-2xl"}`}
      imgClassName="size-full object-contain p-2"
    >
      {discount > 0 && (
        <span className="absolute right-2 top-2 rounded-full bg-accent px-2 py-1 text-[11px] font-black text-accent-foreground shadow-sm">
          خصم {discount}%
        </span>
      )}
      <div className="absolute bottom-2 right-2 z-10 rounded-full bg-background/90 px-2 py-1 text-[10px] font-semibold text-foreground shadow-sm backdrop-blur">
        {packageLabel(product)}
      </div>
      {!product.inStock && (
        <span className="absolute left-2 top-2 z-10 rounded-full bg-background/90 px-2.5 py-1 text-xs font-bold text-destructive shadow-sm">
          نفذت الكمية
        </span>
      )}
    </ClientImage>
  );
}

/** Price line — highlights the price that matches the customer's mode. */
export function PriceBlock({
  product,
  isWholesale,
}: {
  product: Product;
  isWholesale: boolean;
}) {
  const primary = isWholesale ? product.wholesale : product.retail;
  const secondary = isWholesale ? product.retail : product.wholesale;
  return (
    <div className="flex min-w-0 flex-col items-start gap-0.5 text-[13px] leading-tight">
      <div className="flex flex-wrap items-baseline gap-1.5">
        <span className="font-black text-foreground">
          {formatPrice(primary)}
        </span>
        {product.oldPrice && product.oldPrice > product.retail && (
          <span className="text-xs text-muted-foreground line-through">
            {formatPrice(product.oldPrice)}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {isWholesale ? (
          <>قطاعي: {formatPrice(secondary)}</>
        ) : (
          <>جملة: {formatPrice(secondary)}</>
        )}
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
  const hasImage = hasProductImage(product);

  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="h-full">
      <Card className="group flex h-full flex-col overflow-hidden border-border/70 bg-card shadow-sm transition-shadow hover:shadow-md">
        <button
          className="block w-full text-right"
          onClick={() => onOpen(product)}
          aria-label={`عرض ${product.name}`}
        >
          {hasImage ? (
            <ProductArtwork product={product} />
          ) : (
            /* Branded no-image header — compact, NOT an empty gray box */
            <div className="flex items-center gap-3 border-b border-border/60 bg-gradient-to-l from-accent/10 to-transparent p-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <Package className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-bold text-primary">
                  {product.brand ?? "منتجات سوق الجملة"}
                </p>
                <p className="truncate font-bold text-foreground">
                  {product.name}
                </p>
              </div>
            </div>
          )}
        </button>

        <CardContent className="flex flex-1 flex-col gap-2 p-3">
          {hasImage && (
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
          )}
          {!hasImage && product.english && (
            <p className="truncate text-xs text-muted-foreground">
              {product.english}
            </p>
          )}

          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Package className="size-3.5" />
            {packageLabel(product)}
          </p>

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
        </CardContent>
      </Card>
    </motion.div>
  );
}