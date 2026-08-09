import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Category, Product } from "./types";

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

/**
 * URLs that mean "no real image is available yet".
 * The catalog mapper falls back to `/placeholder.svg` (or a placeholder
 * public_id) when a product/category has no uploaded media — the storefront
 * treats those as "no image" and renders a branded content layout instead of
 * a giant empty gray box.
 */
const PLACEHOLDER_MARKERS = [
  "/placeholder.svg",
  "/placeholder-logo.",
  "placeholder-logo",
  "/herogradient.",
  "logo-placeholder",
];

// Word-boundary match so normal words containing "placeholder" (e.g.
// "redeem") are never treated as a missing asset.
const PLACEHOLDER_PATTERN =
  /\/placeholder([\/._-]|$)|(^|\/)no-image([\/._-]|$)|missing-image/i;

/** True when an asset URL points at the generic missing-asset placeholder. */
export function isPlaceholderImage(src?: string | null): boolean {
  if (!src) return true;
  if (PLACEHOLDER_MARKERS.some((marker) => src.includes(marker))) return true;
  return PLACEHOLDER_PATTERN.test(src);
}

/** True when a product actually has a real photo to display. */
export function hasProductImage(
  product: Pick<Product, "image" | "image_url">,
): boolean {
  return !isPlaceholderImage(product.image_url || product.image);
}

/** The image URL to render for a product (canonical alias first). */
export function productImageSrc(
  product: Pick<Product, "image" | "image_url">,
): string {
  return product.image_url || product.image;
}

/** True when a category actually has a real icon/photo. */
export function hasCategoryImage(
  category: Pick<Category, "image">,
): boolean {
  return !isPlaceholderImage(category.image);
}

/** Package/unit line for a product (e.g. "كرتونة × 24"), defaulting to "حبة". */
export function packageLabel(product: Pick<Product, "size">): string {
  return product.size && product.size.trim() ? product.size : "حبة";
}
