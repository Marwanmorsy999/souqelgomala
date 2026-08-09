"use client";

import { Flame, Package, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
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
 * Offer product card — used in the "🔥 عروض النهارده" sales board.
 *
 * Image-aware layout (critical rule):
 *   - WITH a real photo  → photo block on top (discount badge + size pill).
 *   - WITHOUT a photo    → a compact branded product-information block —
 *     NEVER a giant gray placeholder box. The card stays intentional:
 *     [🔥 عرض النهارده] + product name + package/unit + price + CTA.
 */
export function OfferProductCard({
  product,
  onOpen,
  offerLabel,
}: {
  product: Product;
  onOpen: (product: Product) => void;
  offerLabel?: string;
}) {
  const add = useStore((s) => s.add);
  const increment = useStore((s) => s.increment);
  const decrement = useStore((s) => s.decrement);
  const quantity = useStore(
    (s) => s.cart.find((i) => i.id === product.id)?.quantity ?? 0,
  );
  const pct = discountPercent(product);
  const hasImage = hasProductImage(product);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className="h-full"
    >
      <div
        className={cn(
          "flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm",
          hasImage
            ? "border-border/60"
            : "border-primary/15 bg-gradient-to-b from-primary/[0.07] to-transparent",
        )}
      >
        <button
          className="block w-full text-right"
          onClick={() => onOpen(product)}
          aria-label={`عرض ${product.name}`}
        >
          {hasImage ? (
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <ClientImage
                src={productImageSrc(product)}
                alt={product.name}
                imgClassName="size-full object-cover"
                wrapperClassName="size-full"
              >
                {pct > 0 && (
                  <span className="absolute right-2 top-2 rounded-full bg-accent px-2 py-1 text-[11px] font-black text-accent-foreground shadow-sm">
                    خصم {pct}%
                  </span>
                )}
                {offerLabel && (
                  <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-[11px] font-black text-primary-foreground shadow-sm">
                    <Flame className="size-3" />
                    {offerLabel}
                  </span>
                )}
                <span className="absolute bottom-2 left-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold text-foreground shadow-sm backdrop-blur">
                  {packageLabel(product)}
                </span>
                {!product.inStock && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-xs font-black text-white">
                    نفذت الكمية
                  </span>
                )}
              </ClientImage>
            </div>
          ) : (
            /* Branded no-image block — compact, NOT an empty gray box */
            <div className="relative flex items-center gap-3 border-b border-border/50 bg-gradient-to-l from-accent/15 via-transparent to-transparent p-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-accent/30 bg-card text-accent shadow-sm">
                <Package className="size-6" />
              </span>
              <div className="min-w-0">
                {offerLabel && (
                  <p className="truncate text-[10px] font-black text-accent">
                    {offerLabel}
                  </p>
                )}
                {product.brand && (
                  <p className="truncate text-[10px] font-bold text-primary">
                    {product.brand}
                  </p>
                )}
                <p className="truncate font-black text-foreground">
                  {product.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {product.english}
                </p>
              </div>
              {pct > 0 && (
                <span className="mr-auto shrink-0 rounded-full bg-accent px-2 py-1 text-[11px] font-black text-accent-foreground shadow-sm">
                  خصم {pct}%
                </span>
              )}
            </div>
          )}
        </button>

        <div className="flex flex-1 flex-col gap-2 p-3">
          {hasImage && (
            <div className="min-w-0 text-right">
              {product.brand && (
                <p className="truncate text-[10px] font-bold text-primary">
                  {product.brand}
                </p>
              )}
              <p className="truncate font-bold text-foreground">
                {product.name}
              </p>
            </div>
          )}

          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Package className="size-3.5" />
            {packageLabel(product)}
          </p>

          <div className="mt-auto flex items-baseline gap-1.5">
            <span className="text-lg font-black text-foreground">
              {formatPrice(product.retail)}
            </span>
            {product.oldPrice && product.oldPrice > product.retail && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.oldPrice)}
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            جملة: {formatPrice(product.wholesale)}
          </p>

          <div className="mt-1">
            {quantity === 0 ? (
              <button
                onClick={() => product.inStock && add(product.id)}
                disabled={!product.inStock}
                className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-primary text-xs font-black text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingCart className="size-4" />
                اطلب الآن
              </button>
            ) : (
              <div className="flex h-9 w-full items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-1.5">
                <button
                  onClick={() => decrement(product.id)}
                  aria-label={`إنقاص ${product.name}`}
                  className="flex size-7 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary/10"
                >
                  −
                </button>
                <span className="text-sm font-black text-primary">
                  {quantity}
                </span>
                <button
                  onClick={() => product.inStock && increment(product.id)}
                  disabled={!product.inStock}
                  aria-label={`زيادة ${product.name}`}
                  className="flex size-7 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary/10"
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}