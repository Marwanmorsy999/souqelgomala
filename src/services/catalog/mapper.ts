/**
 * Catalog mapper — D1 rows → storefront domain objects.
 *
 * The storefront UI consumes clean `Product`/`Category` objects (lib/types.ts)
 * and never touches Drizzle rows. This mapper is the single translation layer
 * between the D1 catalog model and the existing component contract.
 */

import type { ProductRow, ProductMediaRow, CategoryRow, CategoryMediaRow } from '@/types/database'
import {
  productCardImageUrl,
  categoryImageUrl,
  placeholderImage,
} from '@/lib/cloudinary/urls'

/** Storefront product shape — matches lib/types.ts Product. */
export interface StorefrontProduct {
  id: string
  name: string
  name_ar?: string
  english: string
  size: string
  unit?: string
  retail: number
  price?: number
  wholesale: number
  wholesale_price?: number
  category: string
  category_id?: string | null
  inStock: boolean
  image: string
  image_url?: string
  oldPrice?: number
  brand?: string
  description?: string
  slug?: string
  sku?: string
}

/** Storefront category shape — matches lib/types.ts Category. */
export interface StorefrontCategory {
  id: string
  name: string
  image: string
}

/** Pick the primary media row (or first by display order). */
export function pickPrimaryMedia(media: ProductMediaRow[] | undefined): ProductMediaRow | undefined {
  if (!media || media.length === 0) return undefined
  return (
    media.find((m) => m.is_primary && !m.deleted_at) ??
    [...media]
      .filter((m) => !m.deleted_at)
      .sort((a, b) => a.display_order - b.display_order)[0]
  )
}

function formatUnit(unit: string): string {
  return unit && unit !== 'piece' ? unit : ''
}

/** Map a D1 product (+ resolved category name + media) to the storefront shape. */
export function mapProductToStorefront(
  product: ProductRow,
  opts: { categoryName?: string | null; media?: ProductMediaRow[] } = {}
): StorefrontProduct {
  const primary = pickPrimaryMedia(opts.media)
  const rawImage = primary?.secure_url
  const image =
    rawImage && primary?.cloudinary_public_id
      ? productCardImageUrl(primary.cloudinary_public_id)
      : rawImage || placeholderImage()

  const retail = product.price
  const wholesale = product.wholesale_price ?? product.offer_price ?? product.price
  const inStock = product.stock > 0 && product.status === 'active' && product.is_visible
  const oldPrice =
    product.compare_at_price ??
    (product.offer_price != null && product.offer_price > retail ? product.offer_price : undefined)

  return {
    id: product.id,
    name: product.name_ar,
    name_ar: product.name_ar,
    english: product.name_en ?? '',
    size: formatUnit(product.unit),
    unit: product.unit,
    retail,
    price: retail,
    wholesale,
    wholesale_price: wholesale,
    category: opts.categoryName ?? '',
    category_id: product.category_id ?? null,
    inStock,
    image,
    image_url: image,
    oldPrice,
    brand: product.brand ?? undefined,
    description: product.description ?? undefined,
    slug: product.slug ?? undefined,
    sku: product.sku ?? undefined,
  }
}

/** Map a D1 category (+ media) to the storefront shape. */
export function mapCategoryToStorefront(
  category: CategoryRow,
  opts: { media?: CategoryMediaRow[] } = {}
): StorefrontCategory {
  const primary = (opts.media ?? []).find((m) => m.is_primary && !m.deleted_at)
  const raw = primary?.secure_url
  const image =
    raw && primary?.cloudinary_public_id
      ? categoryImageUrl(primary.cloudinary_public_id)
      : raw || placeholderImage()

  return {
    id: category.id,
    name: category.name_ar,
    image,
  }
}

