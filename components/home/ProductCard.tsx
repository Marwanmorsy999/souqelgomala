"use client";

import { Minus, Plus, ShoppingCart } from "lucide-react";
import { ClientImage } from "@/components/ui/client-image";
import { useStore } from "@/lib/store";
import {
  discountPercent,
  formatPrice,
  hasProductImage,
  productImageSrc,
  packageLabel,
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
            className="w-full aspect-square"
      imgClassName="size-full object-cover"
      wrapperClassName="img-bg"
    >
      {discount > 0 && (
                <span
          className="absolute top-2 end-2 rounded-sm bg-red-error px-[7px] py-0.5 text-[10px] font-black text-white"
          aria-label={`خصم ${discount}%`}
        >
          -{discount}%
        </span>
      )}
      {!product.inStock && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs font-black text-white">
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
        <span
          className="text-price-md font-black text-brand-orange"
          dir="ltr"
        >
          {formatPrice(primary)}
        </span>
        {product.oldPrice && product.oldPrice > primary && (
          <span
            className="text-xs text-muted-foreground line-through"
            dir="ltr"
          >
            {formatPrice(product.oldPrice)}
          </span>
        )}
        {pct > 0 && (
          <span className="text-xs font-bold text-red-error">خصم {pct}%</span>
        )}
        {pct > 0 && (
          <span className="text-xs font-bold text-accent">خصم {pct}%</span>
        )}
      </div>
            <p className="text-[11px] text-text-secondary">
        {isWholesale ? (
          <>جملة: <span dir="ltr">{formatPrice(secondary)}</span></>
        ) : (
          <>قطاعي: <span dir="ltr">{formatPrice(secondary)}</span></>
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
        <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border-default bg-bg-surface text-foreground transition-all duration-200 hover:border-brand-green hover:shadow-sm">
      {hasImage && (
        <button
          className="block w-full text-right"
          onClick={() => onOpen(product)}
          aria-label={`عرض ${product.name}`}
        >
          <ProductArtwork product={product} />
        </button>
      )}

            <div className="flex flex-1 flex-col gap-2 p-3 pt-4">
        {/* Category chip (spec §10 CARDS) */}
        {product.category && (
          <span className="self-start text-[10px] font-bold text-brand-green-light">
            {product.category}
          </span>
        )}

        <button
          className="block min-w-0 text-right"
          onClick={() => onOpen(product)}
          aria-label={`عرض ${product.name}`}
        >
          <p className="line-clamp-2 text-body-sm font-semibold text-foreground">
            {product.name}
          </p>
        </button>

        <p className="text-micro text-text-muted">
          {packageLabel(product)}
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
                            className="flex h-11 w-full items-center justify-center gap-1.5 rounded-md bg-brand-orange text-sm font-black text-white transition-colors hover:bg-brand-orange-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ShoppingCart className="size-4" />
              أضف للسلة
            </button>
          ) : (
                        <div className="flex h-11 w-full items-center justify-between rounded-md border border-brand-green/30 bg-brand-green-dim px-1.5">
              <button
                onClick={() => decrement(product.id)}
                aria-label={`إنقاص ${product.name}`}
                                className="flex size-8 items-center justify-center rounded-md text-brand-green-light transition-colors hover:bg-bg-nav-hover"
              >
                <Minus className="size-4" />
              </button>
              <span className="min-w-5 text-center text-sm font-black text-brand-green-light">
                {quantity}
              </span>
              <button
                onClick={() => product.inStock && increment(product.id)}
                disabled={!product.inStock}
                aria-label={`زيادة ${product.name}`}
                className="flex size-8 items-center justify-center rounded-md text-brand-green-light transition-colors hover:bg-bg-nav-hover"
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