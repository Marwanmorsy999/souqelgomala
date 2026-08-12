"use client";

import { Minus, Plus, ShoppingCart, Package } from "lucide-react";
import { ClientImage } from "@/components/ui/client-image";
import { useStore } from "@/lib/store";
import { formatPrice, isPlaceholderImage } from "@/lib/utils";
import type { Offer } from "@/lib/types";

/**
 * Offer bundle card — used in the daily offers sales board for 'bundle' type offers.
 */
export function OfferBundleCard({
  offer,
}: {
  offer: Offer;
}) {
  const add = useStore((s) => s.add);
  const increment = useStore((s) => s.increment);
  const decrement = useStore((s) => s.decrement);
  const quantity = useStore(
    (s) => s.cart.find((i) => i.id === offer.id)?.quantity ?? 0,
  );
  
  const hasImage = offer.banner && !isPlaceholderImage(offer.banner);
  // Calculate total original price of all products in the bundle to show savings
  const originalTotal = offer.products.reduce((acc, p) => acc + p.retail, 0);
  const price = offer.value ?? originalTotal;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border-default bg-bg-surface">
      {hasImage && (
        <div className="relative aspect-[4/3] w-full overflow-hidden img-bg">
          <ClientImage
            src={offer.banner as string}
            alt={offer.title}
            imgClassName="size-full object-cover"
            wrapperClassName="size-full"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <p className="font-black text-foreground">{offer.title}</p>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {offer.description || offer.products.map(p => p.name).join(" + ")}
        </p>

        <div className="mt-auto flex flex-col gap-1 pt-2">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-price-md font-black text-brand-orange" dir="ltr">
              {formatPrice(price)}
            </span>
            {originalTotal > price && (
              <span className="text-xs text-muted-foreground line-through" dir="ltr">
                {formatPrice(originalTotal)}
              </span>
            )}
            <span className="text-xs font-bold text-red-error">عرض بوكس/باقة</span>
          </div>
        </div>

        {quantity === 0 ? (
          <button
            onClick={() => add(offer.id)}
            className="mt-2 flex h-11 w-full items-center justify-center gap-1.5 rounded-md bg-brand-orange text-sm font-black text-white transition-colors hover:bg-brand-orange-hover"
          >
            <ShoppingCart className="size-4" />
            اطلب الباقة
          </button>
        ) : (
          <div className="mt-2 flex h-11 w-full items-center justify-between rounded-md border border-brand-green/30 bg-brand-green-dim px-1.5">
            <button
              onClick={() => decrement(offer.id)}
              aria-label={`إنقاص ${offer.title}`}
              className="flex size-8 items-center justify-center rounded-md text-brand-green-light transition-colors hover:bg-bg-nav-hover"
            >
              <Minus className="size-4" />
            </button>
            <span className="min-w-5 text-center text-sm font-black text-brand-green-light">
              {quantity}
            </span>
            <button
              onClick={() => increment(offer.id)}
              aria-label={`زيادة ${offer.title}`}
              className="flex size-8 items-center justify-center rounded-md text-brand-green-light transition-colors hover:bg-bg-nav-hover"
            >
              <Plus className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
