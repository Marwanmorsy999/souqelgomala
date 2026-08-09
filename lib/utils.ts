import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Product } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a price number with Egyptian pound sign (e.g. "27 ج.م"). */
export function formatPrice(price: number | null | undefined): string {
  if (price == null) return "—";
  return `${price} ج.م`;
}

/**
 * Calculate the discount percentage from a product's oldPrice vs retail.
 * Returns 0 when there is no valid discount.
 */
export function discountPercent(product: Product): number {
  if (!product.oldPrice || product.oldPrice <= product.retail) return 0;
  return Math.max(
    0,
    Math.round(((product.oldPrice - product.retail) / product.oldPrice) * 100),
  );
}

/**
 * Format a discount percentage as an Arabic string, e.g. "15%".
 */
export function formatDiscount(product: Product): string {
  const pct = discountPercent(product);
  return pct > 0 ? `${pct}%` : "";
}
