"use client";

import { Minus, Plus, ShoppingCart } from "lucide-react";
import { ClientImage } from "@/components/ui/client-image";
import { useStore } from "@/lib/store";
import {
  discountPercent,
  formatPrice,
  hasProductImage,
  productImageSrc,
} from "@/lib/utils";
import type { Product } from "@/lib/types";

/**
 * Product artwork — image-aware.
 *
 * WITH a real photo  -> the photo (single discount badge).
 * WITHOUT a photo    -> NO image area; the card is text-first
 * (name / package / price / CTA).
 */
export function ProductArtwork({
  product,
  large = false,
}: {
  product: Product;
  large?: boolean;
}) {
  if (!hasProductImage(product)) return null;

  const discount = discountPercent(product);

  return (
    <ClientImage
      src={productImageSrc(product)}
      alt={product.name}
      eager={large}
      className="w-full bg-muted aspect-square"
      imgClassName="size-full object-contain p-3"
    >
      {discount > 0 && (
        <span className="absolute right-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-accent-foreground">
          خصم {discount}%
        </span>
      )}
      {!product.inStock && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-xs font-bold text-white">
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
  const pct = discountPercent(product);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-xl font-black text-foreground">
          {formatPrice(primary)}
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
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
      {hasImage && (
        <button
          className="block w-full text-right"
          onClick={() => onOpen(product)}
          aria-label={`عرض ${product.name}`}
        >
          <ProductArtwork product={product} />
        </button>
      )}

      <div className="flex flex-1 flex-col gap-2 p-3">
        <button
          className="block min-w-0 text-right"
          onClick={() => onOpen(product)}
          aria-label={`عرض ${product.name}`}
        >
          <p className="truncate text-sm font-black text-foreground">
            {product.name}
          </p>
        </button>
        <p className="truncate text-xs text-muted-foreground">
          {product.size && product.size.trim() ? product.size : "حبة"}
        </p>

        <div className="mt-1">
          <PriceBlock product={product} isWholesale={isWholesale} />
        </div>

        <div className="mt-auto pt-2">
          {quantity === 0 ? (
            <button
              onClick={() => product.inStock && add(product.id)}
              disabled={!product.inStock}
              aria-label={
                !product.inStock
                  ? `${product.name} نفذت الكمية`
                  : `أضف ${product.name} للسلة`
              }
              className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-primary text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShoppingCart className="size-4" />
              أضف للسلة
            </button>
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
    </div>
  );
}