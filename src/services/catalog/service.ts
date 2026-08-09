/**
 * Catalog service — storefront-facing API layer.
 *
 * This is the ONLY module the storefront/server components use to read catalog
 * data. It wraps the D1 repository with Cloudflare KV caching and maps D1 rows
 * to clean storefront domain objects (lib/types.ts shape) via the mapper.
 *
 * D1 is the source of truth. KV is only a cache — if a key is missing, fall
 * back to D1 and repopulate. Mutations invalidate the relevant cache keys.
 */

import {
  findProductsWithRelations,
  findActiveCategories,
  findCategoriesWithMedia,
  findCategoryById,
  findCategoryByName,
  findProductById,
  findProductBySlug,
  findFeaturedProducts,
  findBestSellerProducts,
  type ProductSearchWhere,
  type ListResult,
} from '@/services/catalog/repository'
import {
  mapProductToStorefront,
  mapCategoryToStorefront,
  type StorefrontProduct,
  type StorefrontCategory,
} from '@/services/catalog/mapper'
import { kvGetOrSet, invalidateCache, CACHE_KEYS } from '@/lib/cloudflare/kv'
import { logger } from '@/lib/logger'

const CATALOG_TTL = 300 // 5 minutes

/** Catalog cache-key registry (extends the central KV keys). */
export const CATALOG_KEYS = {
  CATEGORIES: CACHE_KEYS.CATEGORIES,
  // Products scope keys map to the central PRODUCTS key.
  PRODUCTS: (scope: string) => CACHE_KEYS.PRODUCTS(scope),
  PRODUCT_BY_ID: (id: string) => `catalog:product:id:${id}`,
  PRODUCT_BY_SLUG: (slug: string) => `catalog:product:slug:${slug}`,
  CATEGORY_BY_ID: (id: string) => `catalog:category:id:${id}`,
  CATEGORY_BY_NAME: (name: string) => `catalog:category:name:${name}`,
  FEATURED: 'catalog:featured',
  BEST_SELLERS: 'catalog:best-sellers',
  DISCOUNTED: 'catalog:discounted',
} as const

/** Invalidate all catalog caches after a catalog mutation. */
export async function invalidateCatalogCache(): Promise<void> {
  await invalidateCache(
    CATALOG_KEYS.CATEGORIES,
    CATALOG_KEYS.FEATURED,
    CATALOG_KEYS.BEST_SELLERS,
    CATALOG_KEYS.DISCOUNTED,
    CACHE_KEYS.PRODUCTS('*'),
  )
}

/** Invalidate caches for a specific product (by id + slug). */
export async function invalidateProductCache(id?: string, slug?: string): Promise<void> {
  const keys: string[] = [CACHE_KEYS.PRODUCTS('*'), CATALOG_KEYS.FEATURED, CATALOG_KEYS.BEST_SELLERS, CATALOG_KEYS.DISCOUNTED]
  if (id) keys.push(CATALOG_KEYS.PRODUCT_BY_ID(id))
  if (slug) keys.push(CATALOG_KEYS.PRODUCT_BY_SLUG(slug))
  await invalidateCache(...keys)
}

/** Invalidate caches for a specific category (by id + name). */
export async function invalidateCategoryCache(id?: string, name?: string): Promise<void> {
  const keys: string[] = [CATALOG_KEYS.CATEGORIES, CACHE_KEYS.PRODUCTS('*')]
  if (id) keys.push(CATALOG_KEYS.CATEGORY_BY_ID(id))
  if (name) keys.push(CATALOG_KEYS.CATEGORY_BY_NAME(name))
  await invalidateCache(...keys)
}

// ============================================
// READ METHODS (storefront)
// ============================================

/** All active categories mapped to storefront shape (KV cached). */
export async function getCategories(): Promise<StorefrontCategory[]> {
  return kvGetOrSet(CATALOG_KEYS.CATEGORIES, async () => {
    const rows = await findCategoriesWithMedia()
    return rows.map(({ category, media }) => mapCategoryToStorefront(category, { media }))
  }, CATALOG_TTL)
}

/** A single active category by id (KV cached). */
export async function getCategoryById(id: string): Promise<StorefrontCategory | null> {
  return kvGetOrSet(CATALOG_KEYS.CATEGORY_BY_ID(id), async () => {
    const category = await findCategoryById(id)
    if (!category) return null
    return mapCategoryToStorefront(category)
  }, CATALOG_TTL)
}

/** A single active category by name (KV cached). */
export async function getCategoryByName(name: string): Promise<StorefrontCategory | null> {
  return kvGetOrSet(CATALOG_KEYS.CATEGORY_BY_NAME(name), async () => {
    const category = await findCategoryByName(name)
    if (!category) return null
    return mapCategoryToStorefront(category)
  }, CATALOG_TTL)
}

/** Paginated, active-only products mapped to storefront shape (KV cached per scope). */
export async function getProducts(
  where: ProductSearchWhere = {},
  page = 1,
  pageSize = 20
): Promise<ListResult<StorefrontProduct>> {
  const scope = `${where.categoryId ?? 'all'}:${where.search ?? ''}:${where.discountedOnly ? 'disc' : 'all'}:${page}:${pageSize}`
  return kvGetOrSet(CATALOG_KEYS.PRODUCTS(scope), async () => {
    const { data, total, page: p, pageSize: ps } = await findProductsWithRelations(where, page, pageSize)
    return {
      data: data.map(({ product, categoryName, media }) =>
        mapProductToStorefront(product, { categoryName, media })
      ),
      total,
      page: p,
      pageSize: ps,
    }
  }, CATALOG_TTL)
}

/** Paginated products for a given category (KV cached). */
export async function getProductsByCategory(
  categoryId: string,
  page = 1,
  pageSize = 20
): Promise<ListResult<StorefrontProduct>> {
  return getProducts({ categoryId }, page, pageSize)
}

/** Search active products (KV cached). */
export async function searchProducts(
  query: string,
  page = 1,
  pageSize = 20
): Promise<ListResult<StorefrontProduct>> {
  return getProducts({ search: query }, page, pageSize)
}

/** Discounted active products (KV cached). */
export async function getDiscountedProducts(page = 1, pageSize = 20): Promise<ListResult<StorefrontProduct>> {
  return kvGetOrSet(CATALOG_KEYS.DISCOUNTED, async () => {
    const { data, total, page: p, pageSize: ps } = await findProductsWithRelations({ discountedOnly: true }, page, pageSize)
    return {
      data: data.map(({ product, categoryName, media }) =>
        mapProductToStorefront(product, { categoryName, media })
      ),
      total,
      page: p,
      pageSize: ps,
    }
  }, CATALOG_TTL)
}

/** Featured active products for the homepage (KV cached). */
export async function getFeaturedProducts(limit = 8): Promise<StorefrontProduct[]> {
  return kvGetOrSet(CATALOG_KEYS.FEATURED, async () => {
    const rows = await findFeaturedProducts(limit)
    return rows.map(({ product, categoryName, media }) =>
      mapProductToStorefront(product, { categoryName, media })
    )
  }, CATALOG_TTL)
}

/** Best-seller active products (KV cached). */
export async function getBestSellerProducts(limit = 8): Promise<StorefrontProduct[]> {
  return kvGetOrSet(CATALOG_KEYS.BEST_SELLERS, async () => {
    const rows = await findBestSellerProducts(limit)
    return rows.map(({ product, categoryName, media }) =>
      mapProductToStorefront(product, { categoryName, media })
    )
  }, CATALOG_TTL)
}

/** Latest/new-arrival products for the homepage. */
export async function getLatestProducts(limit = 6): Promise<StorefrontProduct[]> {
  return kvGetOrSet(CATALOG_KEYS.PRODUCTS('latest'), async () => {
    const { data } = await findProductsWithRelations({}, 1, limit)
    return data.map(({ product, categoryName, media }) =>
      mapProductToStorefront(product, { categoryName, media })
    )
  }, CATALOG_TTL)
}

/** Single active product by id (KV cached). */
export async function getProductById(id: string): Promise<StorefrontProduct | null> {
  return kvGetOrSet(CATALOG_KEYS.PRODUCT_BY_ID(id), async () => {
    const row = await findProductById(id)
    if (!row) return null
    return mapProductToStorefront(row.product, { categoryName: row.categoryName, media: row.media })
  }, CATALOG_TTL)
}

/** Single active product by slug (KV cached). */
export async function getProductBySlug(slug: string): Promise<StorefrontProduct | null> {
  return kvGetOrSet(CATALOG_KEYS.PRODUCT_BY_SLUG(slug), async () => {
    const row = await findProductBySlug(slug)
    if (!row) return null
    return mapProductToStorefront(row.product, { categoryName: row.categoryName, media: row.media })
  }, CATALOG_TTL)
}

/** Log a cache miss/mutation helper (kept minimal; real logging in repository layer). */
export function logCatalogEvent(message: string, meta?: Record<string, unknown>): void {
  logger.info(`Catalog: ${message}`, meta)
}
