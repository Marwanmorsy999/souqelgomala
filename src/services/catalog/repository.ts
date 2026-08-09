/**
 * Catalog repository — D1 + Drizzle data access.
 *
 * This is the ONLY place that queries the D1 catalog tables for storefront use.
 * Server components / API routes / features go through the service layer, never
 * query the DB directly. All queries filter to active, visible, non-deleted
 * products so the storefront only ever sees live catalog data.
 */

import { db } from '@/db'
import {
  products,
  categories,
  productMedia,
  categoryMedia,
} from '@/db/schema/catalog'
import { offers } from '@/db/schema/offers'
import type { ProductRow, ProductMediaRow, CategoryRow, CategoryMediaRow, OfferRow } from '@/types/database'
import { eq, and, gt, like, or, desc, asc, count, inArray, isNull, lte, gte } from 'drizzle-orm'

/** Active, visible, non-deleted product filter. */
const ACTIVE = (t: typeof products) =>
  and(
    gt(t.stock, 0),
    eq(t.is_visible, true),
    eq(t.status, 'active'),
    isNull(t.deleted_at),
  )

export interface ProductSearchWhere {
  categoryId?: string
  search?: string
  discountedOnly?: boolean
}

export interface ListResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

async function loadProductMedia(productIds: string[]): Promise<Map<string, ProductMediaRow[]>> {
  if (productIds.length === 0) return new Map()
  const rows = await db
    .select()
    .from(productMedia)
    .where(and(inArray(productMedia.product_id, productIds), isNull(productMedia.deleted_at)))
  const map = new Map<string, ProductMediaRow[]>()
  for (const row of rows.sort((a, b) => a.display_order - b.display_order)) {
    const list = map.get(row.product_id) ?? []
    list.push(row)
    map.set(row.product_id, list)
  }
  return map
}

async function loadCategoryMedia(categoryIds: string[]): Promise<Map<string, CategoryMediaRow[]>> {
  if (categoryIds.length === 0) return new Map()
  const rows = await db
    .select()
    .from(categoryMedia)
    .where(and(inArray(categoryMedia.category_id, categoryIds), isNull(categoryMedia.deleted_at)))
  const map = new Map<string, CategoryMediaRow[]>()
  for (const row of rows) {
    const list = map.get(row.category_id) ?? []
    list.push(row)
    map.set(row.category_id, list)
  }
  return map
}

/** Active categories for the storefront (visible, non-deleted). */
export async function findActiveCategories(): Promise<CategoryRow[]> {
  const cats = await db
    .select()
    .from(categories)
    .where(and(eq(categories.is_visible, true), isNull(categories.deleted_at)))
    .orderBy(asc(categories.sort_order))
  return cats
}

/** Active categories with their primary/featured media resolved. */
export async function findCategoriesWithMedia(): Promise<Array<{ category: CategoryRow; media: CategoryMediaRow[] }>> {
  const cats = await findActiveCategories()
  const mediaMap = await loadCategoryMedia(cats.map((c) => c.id))
  return cats.map((category) => ({ category, media: mediaMap.get(category.id) ?? [] }))
}

/** Single category by id (active only). */
export async function findCategoryById(id: string): Promise<CategoryRow | null> {
  const row = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, id), eq(categories.is_visible, true), isNull(categories.deleted_at)))
    .limit(1)
  return row[0] ?? null
}

/** Single category by slug-like identifier (name) used by the storefront. */
export async function findCategoryByName(name: string): Promise<CategoryRow | null> {
  const row = await db
    .select()
    .from(categories)
    .where(and(eq(categories.name_ar, name), eq(categories.is_visible, true), isNull(categories.deleted_at)))
    .limit(1)
  return row[0] ?? null
}

/** Paginated, active-only product listing. */
export async function findProducts(where: ProductSearchWhere = {}, page = 1, pageSize = 20): Promise<ListResult<ProductRow>> {
  const conditions: unknown[] = []
  conditions.push(ACTIVE(products))
  if (where.categoryId) conditions.push(eq(products.category_id, where.categoryId))
  if (where.search) {
    const term = `%${where.search.trim()}%`
    conditions.push(or(like(products.name_ar, term), like(products.name_en, term), like(products.brand, term)))
  }
  if (where.discountedOnly) conditions.push(gt(products.offer_price, 0))

  const whereExpr = and(...conditions as never[])
  const totalRows = await db
    .select({ value: count() })
    .from(products)
    .where(whereExpr ?? undefined as never)
  const total = totalRows[0]?.value ?? 0

  const rows = await db
    .select()
    .from(products)
    .where(whereExpr ?? undefined as never)
    .orderBy(desc(products.is_featured), asc(products.display_order), desc(products.created_at))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  return { data: rows, total, page, pageSize }
}

/** Products joined with category name + media (storefront-ready rows). */
export async function findProductsWithRelations(
  where: ProductSearchWhere = {},
  page = 1,
  pageSize = 20
): Promise<ListResult<{ product: ProductRow; categoryName: string | null; media: ProductMediaRow[] }>> {
  const { data, total, page: p, pageSize: ps } = await findProducts(where, page, pageSize)
  const mediaMap = await loadProductMedia(data.map((d) => d.id))
  const categoryIds = [...new Set(data.map((d) => d.category_id).filter(Boolean) as string[])]
  const cats = categoryIds.length ? await db.select().from(categories).where(inArray(categories.id, categoryIds)) : []
  const catMap = new Map(cats.map((c) => [c.id, c.name_ar]))
  const result = data.map((product) => ({
    product,
    categoryName: product.category_id ? (catMap.get(product.category_id) ?? null) : null,
    media: mediaMap.get(product.id) ?? [],
  }))
  return { data: result, total, page: p, pageSize: ps }
}

type ProductWithRelations = {
  product: ProductRow
  categoryName: string | null
  media: ProductMediaRow[]
}

async function loadProductWithRelations(productId: string): Promise<ProductWithRelations | null> {
  const row = await db
    .select()
    .from(products)
    .where(and(eq(products.id, productId), eq(products.is_visible, true), eq(products.status, 'active'), isNull(products.deleted_at)))
    .limit(1)
  if (!row[0]) return null
  const mediaMap = await loadProductMedia([productId])
  const media = mediaMap.get(productId) ?? []
  const categoryName = row[0].category_id
    ? (await findCategoryById(row[0].category_id))?.name_ar ?? null
    : null
  return { product: row[0], categoryName, media }
}

/** Single product by id (active only, with relations). */
export async function findProductById(id: string): Promise<ProductWithRelations | null> {
  return loadProductWithRelations(id)
}

/** Single product by slug (active only, with relations). */
export async function findProductBySlug(slug: string): Promise<ProductWithRelations | null> {
  const row = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.is_visible, true), eq(products.status, 'active'), isNull(products.deleted_at)))
    .limit(1)
  if (!row[0]) return null
  const mediaMap = await loadProductMedia([row[0].id])
  const categoryName = row[0].category_id
    ? (await findCategoryById(row[0].category_id))?.name_ar ?? null
    : null
  return { product: row[0], categoryName, media: mediaMap.get(row[0].id) ?? [] }
}

async function findProductsByFlag(
  flag: 'is_featured' | 'is_best_seller',
  limit = 8
): Promise<ProductWithRelations[]> {
  const rows = await db
    .select()
    .from(products)
    .where(and(ACTIVE(products), eq(products[flag], true)))
    .orderBy(desc(products.display_order), desc(products.created_at))
    .limit(limit)
  const mediaMap = await loadProductMedia(rows.map((r) => r.id))
  const categoryIds = [...new Set(rows.map((r) => r.category_id).filter(Boolean) as string[])]
  const cats = categoryIds.length ? await db.select().from(categories).where(inArray(categories.id, categoryIds)) : []
  const catMap = new Map(cats.map((c) => [c.id, c.name_ar]))
  return rows.map((product) => ({
    product,
    categoryName: product.category_id ? (catMap.get(product.category_id) ?? null) : null,
    media: mediaMap.get(product.id) ?? [],
  }))
}

/** Featured (or new-arrival) active products for the homepage. */
export async function findFeaturedProducts(limit = 8): Promise<ProductWithRelations[]> {
  return findProductsByFlag('is_featured', limit)
}

/** Best-seller active products. */
export async function findBestSellerProducts(limit = 8): Promise<ProductWithRelations[]> {
  return findProductsByFlag('is_best_seller', limit)
}

// ============================================
// OFFERS (campaign-level promotions)
// ============================================

/**
 * Parse the `product_ids` JSON column from an offer row.
 * The D1 schema stores it as TEXT (JSON array), so we parse defensively
 * to handle both string and array shapes.
 */
function parseOfferProductIds(row: OfferRow): string[] {
  const raw = row.product_ids
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return Array.isArray(raw) ? raw : []
}

/**
 * Active campaign offers currently within their scheduled window.
 * Returns raw D1 rows (product_ids still JSON-encoded).
 */
export async function findActiveOffers(): Promise<OfferRow[]> {
  const now = new Date().toISOString()
  const rows = await db
    .select()
    .from(offers)
    .where(
      and(
        eq(offers.status, 'active'),
        lte(offers.start_date, now),
        gte(offers.end_date, now),
        isNull(offers.deleted_at),
      ),
    )
    .orderBy(desc(offers.start_date))
  return rows
}

/**
 * Resolve a set of product IDs to active storefront products (with
 * category name + media), ordered by display_order.
 */
export async function findProductsByIdsWithRelations(
  productIds: string[],
): Promise<ProductWithRelations[]> {
  if (productIds.length === 0) return []
  const rows = await db
    .select()
    .from(products)
    .where(and(ACTIVE(products), inArray(products.id, productIds)))
    .orderBy(asc(products.display_order), desc(products.created_at))
  const mediaMap = await loadProductMedia(rows.map((r) => r.id))
  const categoryIds = [...new Set(rows.map((r) => r.category_id).filter(Boolean) as string[])]
  const cats =
    categoryIds.length
      ? await db.select().from(categories).where(inArray(categories.id, categoryIds))
      : []
  const catMap = new Map(cats.map((c) => [c.id, c.name_ar]))
  return rows.map((product) => ({
    product,
    categoryName: product.category_id ? (catMap.get(product.category_id) ?? null) : null,
    media: mediaMap.get(product.id) ?? [],
  }))
}

/**
 * Active offers with their referenced products resolved to storefront rows.
 * Each offer's product_ids JSON is parsed and the matching products are fetched.
 */
export async function findActiveOffersWithProducts(): Promise<
  Array<{ offer: OfferRow; productIds: string[]; products: ProductWithRelations[] }>
> {
  const rows = await findActiveOffers()
  const result: Array<{ offer: OfferRow; productIds: string[]; products: ProductWithRelations[] }> = []
  for (const row of rows) {
    const ids = parseOfferProductIds(row)
    const resolved = ids.length > 0 ? await findProductsByIdsWithRelations(ids) : []
    result.push({ offer: row, productIds: ids, products: resolved })
  }
  return result
}
