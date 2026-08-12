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
import { eq, and, gt, like, or, desc, asc, count, inArray, isNull, lte, gte, sql } from 'drizzle-orm'

/** Active, visible, non-deleted product filter. */
const ACTIVE = (t: typeof products) =>
  and(
    gt(t.stock, 0),
    eq(t.is_visible, true),
    eq(t.status, 'active'),
    isNull(t.deleted_at),
  )

export type ProductSort =
  | 'default'
  | 'price_asc'
  | 'price_desc'
  | 'newest'
  | 'best_seller'
  | 'featured'

export interface ProductSearchWhere {
  categoryId?: string
  /** Explicit product ids (used to fetch just the cart items without loading
   *  the whole catalog — important with 7000+ products). */
  ids?: string[]
  search?: string
  discountedOnly?: boolean
  minPrice?: number
  maxPrice?: number
  /** Normalized unit facet value (e.g. "كيلو", "حبة"). */
  unit?: string
  inStockOnly?: boolean
  sort?: ProductSort
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
  const rows: CategoryMediaRow[] = []
  // D1 limits bound parameters per statement (~100); chunk the IN(...) list.
  for (const ids of chunkArray(categoryIds, 100)) {
    const chunk = await db
      .select()
      .from(categoryMedia)
      .where(and(inArray(categoryMedia.category_id, ids), isNull(categoryMedia.deleted_at)))
    rows.push(...chunk)
  }
  const map = new Map<string, CategoryMediaRow[]>()
  for (const row of rows) {
    const list = map.get(row.category_id) ?? []
    list.push(row)
    map.set(row.category_id, list)
  }
  return map
}

/** All categories (id -> parent_id) — used to expand category filters across the tree. */
async function loadCategoryParentMap(): Promise<Map<string, string | null>> {
  const rows = await db.select({ id: categories.id, parent_id: categories.parent_id }).from(categories)
  const map = new Map<string, string | null>()
  for (const r of rows) map.set(r.id, r.parent_id ?? null)
  return map
}

/** Reverse of the parent map: parent id -> child ids. */
async function loadCategoryChildMap(): Promise<Map<string, string[]>> {
  const parents = await loadCategoryParentMap()
  const children = new Map<string, string[]>()
  for (const [id, pid] of parents) {
    if (pid) {
      const arr = children.get(pid) ?? []
      arr.push(id)
      children.set(pid, arr)
    }
  }
  return children
}

/**
 * Resolve a category id to itself + its entire subtree (all descendants). Lets a
 * product assigned to any child category show when its parent (or any ancestor)
 * is selected, and vice-versa — so every item is reachable from its category or
 * any subcategory in its path.
 */
async function expandCategoryToSubtree(categoryId: string): Promise<string[]> {
  const children = await loadCategoryChildMap()
  const ids = new Set<string>([categoryId])
  const stack = [categoryId]
  while (stack.length) {
    const cur = stack.pop()!
    for (const child of children.get(cur) ?? []) {
      if (!ids.has(child)) {
        ids.add(child)
        stack.push(child)
      }
    }
  }
  return [...ids]
}

/** Split an array into chunks (D1 caps bound parameters per statement). */
function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
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

/**
 * Product counts per category id (active products only), expanded across the
 * subtree so every category shows the count of products reachable from it —
 * i.e. a product on a child category is also counted under its parent and every
 * ancestor, and a parent's count includes all of its descendants.
 */
export async function findCategoryProductCounts(): Promise<Map<string, number>> {
  const rows = await db
    .select({ category_id: products.category_id, count: count() })
    .from(products)
    .where(ACTIVE(products))
    .groupBy(products.category_id)
  const direct = new Map<string, number>()
  for (const r of rows) {
    if (r.category_id) direct.set(r.category_id, r.count)
  }
  const parents = await loadCategoryParentMap()
  const children = new Map<string, string[]>()
  for (const [id, pid] of parents) {
    if (pid) {
      const arr = children.get(pid) ?? []
      arr.push(id)
      children.set(pid, arr)
    }
  }
  const expanded = new Map<string, number>()
  for (const id of parents.keys()) {
    let total = 0
    const stack = [id]
    const seen = new Set<string>()
    while (stack.length) {
      const cur = stack.pop()!
      if (seen.has(cur)) continue
      seen.add(cur)
      total += direct.get(cur) ?? 0
      for (const ch of children.get(cur) ?? []) stack.push(ch)
    }
    expanded.set(id, total)
  }
  return expanded
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
  if (where.categoryId) {
    // Include the whole subtree so a product on any child category shows when its
    // parent (or any ancestor) is selected, and vice-versa.
    const ids = await expandCategoryToSubtree(where.categoryId)
    conditions.push(inArray(products.category_id, ids))
  }
  if (where.ids && where.ids.length > 0) {
    conditions.push(inArray(products.id, where.ids))
  }
  if (where.search) {
    const term = `%${where.search.trim()}%`
    conditions.push(or(like(products.name_ar, term), like(products.name_en, term), like(products.brand, term)))
  }
  if (where.discountedOnly) conditions.push(gt(products.offer_price, 0))
  if (typeof where.minPrice === 'number' && Number.isFinite(where.minPrice)) {
    conditions.push(gte(products.price, where.minPrice))
  }
  if (typeof where.maxPrice === 'number' && Number.isFinite(where.maxPrice)) {
    conditions.push(lte(products.price, where.maxPrice))
  }
  if (where.unit) conditions.push(eq(products.unit, where.unit))
  if (where.inStockOnly) conditions.push(gt(products.stock, 0))

  const whereExpr = and(...conditions as never[])
  const totalRows = await db
    .select({ value: count() })
    .from(products)
    .where(whereExpr ?? undefined as never)
  const total = totalRows[0]?.value ?? 0

  const orderBy = buildProductSort(where.sort)
  const rows = await db
    .select()
    .from(products)
    .where(whereExpr ?? undefined as never)
    .orderBy(...orderBy)
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  return { data: rows, total, page, pageSize }
}

/** Map the requested sort to Drizzle order expressions (backward-compatible). */
function buildProductSort(sort?: ProductSort) {
  switch (sort) {
    case 'price_asc':
      return [asc(products.price)]
    case 'price_desc':
      return [desc(products.price)]
    case 'newest':
      return [desc(products.created_at)]
    case 'best_seller':
      return [desc(products.is_best_seller), desc(products.created_at)]
    case 'featured':
      return [desc(products.is_featured), desc(products.created_at)]
    case 'default':
    default:
      return [desc(products.is_featured), asc(products.display_order), desc(products.created_at)]
  }
}

export interface CatalogFacets {
  units: string[]
  priceMin: number
  priceMax: number
  categories: Array<{ id: string; name: string; parentId: string | null }>
}

/**
 * Distinct facet values for the storefront filter UI:
 *   - normalized unit values present on active products
 *   - active price bounds
 *   - active category tree (id + parent)
 */
export async function findFacets(): Promise<CatalogFacets> {
  const active = ACTIVE(products)
  const unitRows = await db
    .selectDistinct({ unit: products.unit })
    .from(products)
    .where(active)
  const priceRows = await db
    .select({ min: sql<number>`min(${products.price})`, max: sql<number>`max(${products.price})` })
    .from(products)
    .where(active)
  const cats = await db
    .select({ id: categories.id, name_ar: categories.name_ar, parent_id: categories.parent_id })
    .from(categories)
    .where(and(eq(categories.is_visible, true), isNull(categories.deleted_at)))

  const units = unitRows
    .map((r) => r.unit)
    .filter((u): u is string => typeof u === 'string' && u.length > 0)
    .sort((a, b) => a.localeCompare(b, 'ar'))
  const priceMin = priceRows[0]?.min ?? 0
  const priceMax = priceRows[0]?.max ?? 0
  const categoriesList = cats.map((c) => ({ id: c.id, name: c.name_ar, parentId: c.parent_id ?? null }))

  return { units, priceMin, priceMax, categories: categoriesList }
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
