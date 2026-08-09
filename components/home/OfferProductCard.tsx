"use client";

import { ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import { ClientImage } from "@/components/ui/client-image";
import { useStore } from "@/lib/store";
import { discountPercent, formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/types";

/**
 * Compact offer product card used inside the Daily Offers carousel.
 *
 * Reuses the existing ClientImage (graceful placeholder fallback — no broken
 * image glyphs, no skeleton loaders for missing photos) and the Zustand cart
 * store so add-to-cart works exactly like the rest of the storefront.
 */
export function OfferProductCard({
  product,
  onOpen,
}: {
  product: Product;
  onOpen: (product: Product) => void;
}) {
  const add = useStore((s) => s.add);
  const increment = useStore((s) => s.increment);
  const decrement = useStore((s) => s.decrement);
  const quantity = useStore(
    (s) => s.cart.find((i) => i.id === product.id)?.quantity ?? 0,
  );
  const pct = discountPercent(product);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className="w-64 shrink-0 snap-start rounded-2xl border border-border/60 bg-card shadow-sm md:w-auto"
    >
      <button
        className="text-right"
        onClick={() => onOpen(product)}
        aria-label={`عرض ${product.name}`}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-2xl">
          <ClientImage
            src={product.image_url || product.image}
            alt={product.name}
            imgClassName="size-full object-cover"
            wrapperClassName="size-full"
          >
            {pct > 0 && (
              <span className="absolute right-2 top-2 rounded-full bg-accent px-2 py-1 text-[11px] font-black text-accent-foreground shadow-sm">
                خصم {pct}%
              </span>
            )}
            <span className="absolute bottom-2 left-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold text-foreground shadow-sm backdrop-blur">
              {product.size || "حبة"}
            </span>
            {!product.inStock && (
              <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-muted-foreground/70">
                نفذت الكمية
              </span>
            )}
          </ClientImage>
        </div>

        <div className="p-3">
          {product.brand && (
            <p className="text-[10px] font-bold text-primary">{product.brand}</p>
          )}
          <p className="truncate font-bold text-foreground">{product.name}</p>
          {product.english && (
            <p className="truncate text-xs text-muted-foreground">
              {product.english}
            </p>
          )}

          <div className="mt-2 flex flex-col gap-1">
            <div className="flex items-baseline gap-1.5">
              <span className="font-black text-foreground">
                {formatPrice(product.retail)}
              </span>
              {product.oldPrice && product.oldPrice > product.retail && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatPrice(product.oldPrice)}
                </span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">
              جملة: {formatPrice(product.wholesale)}
            </p>
          </div>

          <div className="mt-2.5">
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
                  className="flex size-7 items-center justify-center text-primary transition-colors hover:bg-primary/10"
                >
                  −
                </button>
                <span className="text-sm font-black text-primary">{quantity}</span>
                <button
                  onClick={() => product.inStock && increment(product.id)}
                  disabled={!product.inStock}
                  className="flex size-7 items-center justify-center text-primary transition-colors hover:bg-primary/10"
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>
      </button>
    </motion.div>
  );
}
