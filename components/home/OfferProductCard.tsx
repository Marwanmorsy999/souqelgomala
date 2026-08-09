"use client";

import { Minus, Plus, ShoppingCart } from "lucide-react";
import { ClientImage } from "@/components/ui/client-image";
import { useStore } from "@/lib/store";
import {
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
 *   - WITH a real photo  -> photo on top (single discount badge on the photo).
 *   - WITHOUT a photo    -> NO image area at all. Text-first card:
 *     product name, package/unit, price, "اطلب الآن".
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
  const hasImage = hasProductImage(product);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
      {hasImage && (
        <button
          className="block w-full text-right"
          onClick={() => onOpen(product)}
          aria-label={`عرض ${product.name}`}
        >
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
            <ClientImage
              src={productImageSrc(product)}
              alt={product.name}
              imgClassName="size-full object-cover"
              wrapperClassName="size-full"
            >
              {pct > 0 && (
                <span className="absolute right-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-accent-foreground">
                  خصم {pct}%
                </span>
              )}
              {!product.inStock && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-xs font-bold text-white">
                  نفذت الكمية
                </span>
              )}
            </ClientImage>
          </div>
        </button>
      )}

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <button
          className="block min-w-0 text-right"
          onClick={() => onOpen(product)}
          aria-label={`عرض ${product.name}`}
        >
          <p className="truncate font-black text-foreground">{product.name}</p>
        </button>
        <p className="truncate text-xs text-muted-foreground">
          {packageLabel(product)}
        </p>

        <div className="mt-auto flex flex-col gap-1 pt-2">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-xl font-black text-foreground">
              {formatPrice(product.retail)}
            </span>
            {product.oldPrice && product.oldPrice > product.retail && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.oldPrice)}
              </span>
            )}
            {pct > 0 && (
              <span className="text-xs font-bold text-accent">خصم {pct}%</span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            جملة: {formatPrice(product.wholesale)}
          </p>
        </div>

        {quantity === 0 ? (
          <button
            onClick={() => product.inStock && add(product.id)}
            disabled={!product.inStock}
            className="mt-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-primary text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingCart className="size-4" />
            اطلب الآن
          </button>
        ) : (
          <div className="mt-2 flex h-9 w-full items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-1.5">
            <button
              onClick={() => decrement(product.id)}
              aria-label={`إنقاص ${product.name}`}
              className="flex size-7 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary/10"
            >
              <Minus className="size-4" />
            </button>
            <span className="text-sm font-black text-primary">{quantity}</span>
            <button
              onClick={() => product.inStock && increment(product.id)}
              disabled={!product.inStock}
              aria-label={`زيادة ${product.name}`}
              className="flex size-7 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary/10"
            >
              <Plus className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}