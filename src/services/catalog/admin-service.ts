/**
 * Admin catalog service — write path.
 *
 * Server-side only. Enforces RBAC (products.write / categories.write) using the
 * existing auth/RBAC architecture, then performs D1 mutations with Zod-validated
 * input. After any catalog mutation it invalidates the relevant KV caches so the
 * storefront refetches from D1 (source of truth).
 *
 * Media flow:
 *   1. Admin uploads image bytes to an authenticated endpoint.
 *   2. The endpoint validates the file and uploads to Cloudinary (server-side).
 *   3. Only AFTER a successful Cloudinary upload is a D1 media record created.
 *   4. Deletion removes the D1 record AND best-effort deletes the Cloudinary asset.
 */

import { getDb } from '@/db'
import { products, productMedia, categoryMedia, categories } from '@/db/schema/catalog'
import type { User } from '@/services/auth'
import { hasPermission, type Role } from '@/lib/permissions'
import { createProductSchema, updateProductSchema, type CreateProductInput, type UpdateProductInput } from '@/lib/validations'
import { nanoid } from 'nanoid'
import { eq, inArray, isNull, and, desc, asc, or, like, type SQL } from 'drizzle-orm'
import { deleteCloudinaryAsset } from '@/lib/cloudinary/upload'
import {
  invalidateCatalogCache,
  invalidateProductCache,
  invalidateCategoryCache,
} from '@/services/catalog/service'
import { logger } from '@/lib/logger'

export class AdminCatalogError extends Error {
  constructor(message: string, public status = 400) {
    super(message)
    this.name = 'AdminCatalogError'
  }
}

/** Assert the user has write permission for a resource. Throws 403 otherwise. */
export function assertCanWrite(user: User, resource: 'products' | 'categories'): void {
  const permission = resource === 'products' ? 'products.write' : 'categories.write'
  if (!hasPermission(user.role as Role, permission)) {
    throw new AdminCatalogError('ليس لديك صلاحية لهذه العملية', 403)
  }
}

function now(): string {
  return new Date().toISOString()
}

// ============================================
// PRODUCT WRITES
// ============================================

/** Create a product. Returns the created product row. */
export async function createProduct(user: User, input: CreateProductInput) {
  assertCanWrite(user, 'products')
  const parsed = createProductSchema.parse(input)
  const id = crypto.randomUUID()
  const ts = now()
  const slug = parsed.slug ?? parsed.nameAr.split(' ').join('-')

  try {
    const [row] = await getDb().insert(products).values({
      id,
      barcode: parsed.barcode ?? null,
      sku: parsed.sku ?? null,
      slug: slug ?? null,
      name_ar: parsed.nameAr,
      name_en: parsed.nameEn ?? null,
      description: parsed.description ?? null,
      brand: parsed.brand ?? null,
      category_id: parsed.categoryId ?? null,
      price: parsed.price,
      offer_price: parsed.offerPrice ?? null,
      wholesale_price: parsed.wholesalePrice ?? null,
      compare_at_price: parsed.compareAtPrice ?? null,
      cost_price: parsed.costPrice ?? null,
      unit: parsed.unit,
      weight: parsed.weight ?? null,
      stock: parsed.stock,
      min_stock: parsed.minStock,
      display_order: parsed.displayOrder,
      image_alt: parsed.imageAlt ?? null,
      is_featured: parsed.isFeatured,
      is_new_arrival: parsed.isNewArrival,
      is_best_seller: parsed.isBestSeller,
      is_visible: parsed.isVisible,
      status: parsed.status,
      created_at: ts,
      updated_at: ts,
    }).returning()
    await invalidateCatalogCache()
    logger.info('Admin catalog: product created', { id, slug })
    return row
  } catch (err) {
    throw new AdminCatalogError('تعذر إنشاء المنتج', 500)
  }
}

/** Update a product (partial). Returns the updated row. */
export async function updateProduct(user: User, id: string, input: UpdateProductInput) {
  assertCanWrite(user, 'products')
  const parsed = updateProductSchema.parse(input)
  const existing = await getDb().select().from(products).where(eq(products.id, id)).limit(1)
  if (!existing[0]) throw new AdminCatalogError('المنتج غير موجود', 404)

  try {
const row = await getDb().update(products).set({
      ...(parsed.barcode !== undefined ? { barcode: parsed.barcode ?? null } : {}),
      ...(parsed.sku !== undefined ? { sku: parsed.sku ?? null } : {}),
      ...(parsed.slug !== undefined ? { slug: parsed.slug ?? null } : {}),
      ...(parsed.nameAr !== undefined ? { name_ar: parsed.nameAr } : {}),
      ...(parsed.nameEn !== undefined ? { name_en: parsed.nameEn ?? null } : {}),
      ...(parsed.description !== undefined ? { description: parsed.description ?? null } : {}),
      ...(parsed.brand !== undefined ? { brand: parsed.brand ?? null } : {}),
      ...(parsed.categoryId !== undefined ? { category_id: parsed.categoryId ?? null } : {}),
      ...(parsed.price !== undefined ? { price: parsed.price } : {}),
      ...(parsed.offerPrice !== undefined ? { offer_price: parsed.offerPrice ?? null } : {}),
      ...(parsed.wholesalePrice !== undefined ? { wholesale_price: parsed.wholesalePrice ?? null } : {}),
      ...(parsed.compareAtPrice !== undefined ? { compare_at_price: parsed.compareAtPrice ?? null } : {}),
      ...(parsed.costPrice !== undefined ? { cost_price: parsed.costPrice ?? null } : {}),
      ...(parsed.unit !== undefined ? { unit: parsed.unit } : {}),
      ...(parsed.weight !== undefined ? { weight: parsed.weight ?? null } : {}),
      ...(parsed.stock !== undefined ? { stock: parsed.stock } : {}),
      ...(parsed.minStock !== undefined ? { min_stock: parsed.minStock } : {}),
      ...(parsed.displayOrder !== undefined ? { display_order: parsed.displayOrder } : {}),
      ...(parsed.imageAlt !== undefined ? { image_alt: parsed.imageAlt ?? null } : {}),
      ...(parsed.isFeatured !== undefined ? { is_featured: parsed.isFeatured } : {}),
      ...(parsed.isNewArrival !== undefined ? { is_new_arrival: parsed.isNewArrival } : {}),
      ...(parsed.isBestSeller !== undefined ? { is_best_seller: parsed.isBestSeller } : {}),
      ...(parsed.isVisible !== undefined ? { is_visible: parsed.isVisible } : {}),
      ...(parsed.status !== undefined ? { status: parsed.status } : {}),
      updated_at: now(),
    }).where(eq(products.id, id)).returning().get()
    await invalidateProductCache(id, row?.slug ?? undefined)
    logger.info('Admin catalog: product updated', { id })
    return row
  } catch (err) {
    throw new AdminCatalogError('تعذر تحديث المنتج', 500)
  }
}

/** Soft-delete a product (deleted_at) + invalidate caches. */
export async function softDeleteProduct(user: User, id: string) {
  assertCanWrite(user, 'products')
  const existing = await getDb().select().from(products).where(eq(products.id, id)).limit(1)
  if (!existing[0]) throw new AdminCatalogError('المنتج غير موجود', 404)
  const slug = existing[0].slug ?? undefined
  await getDb().update(products)
    .set({ deleted_at: now(), updated_at: now(), is_visible: false, status: 'inactive' })
    .where(eq(products.id, id))
  await invalidateProductCache(id, slug)
  logger.info('Admin catalog: product soft-deleted', { id })
  return { success: true }
}

// ============================================
// PRODUCT LISTING (ADMIN — includes hidden/inactive)
// ============================================

export interface AdminProductListItem {
  id: string
  name_ar: string
  name_en: string | null
  brand: string | null
  sku: string | null
  barcode: string | null
  category_id: string | null
  category_name: string | null
  price: number | null
  offer_price: number | null
  wholesale_price: number | null
  compare_at_price: number | null
  unit: string | null
  stock: number | null
  min_stock: number | null
  is_featured: boolean
  is_visible: boolean
  status: string
  description: string | null
  slug: string | null
  created_at: string
  updated_at: string
  image_url: string | null
  media: Array<{
    id: string
    secure_url: string
    cloudinary_public_id: string
    is_primary: boolean
    display_order: number
  }>
}

/** Every non-deleted product (any status) with its primary image for the admin table. */
export async function listProductsAdmin(opts: { search?: string; categoryId?: string } = {}) {
  const conditions: SQL[] = [isNull(products.deleted_at)]
  if (opts.categoryId) conditions.push(eq(products.category_id, opts.categoryId))
  if (opts.search?.trim()) {
    const q = `%${opts.search.trim()}%`
    conditions.push(orLike(products.name_ar, q)!)
  }

  const rows = await getDb()
    .select()
    .from(products)
    .where(and(...conditions))
    .orderBy(desc(products.created_at))
    .limit(500)

  const ids = rows.map((r) => r.id)
  const mediaRows = ids.length
    ? await getDb()
        .select()
        .from(productMedia)
        .where(and(inArray(productMedia.product_id, ids), isNull(productMedia.deleted_at)))
        .orderBy(asc(productMedia.display_order))
    : []
  const mediaByProduct = new Map<string, NonNullable<AdminProductListItem['media']>>()
  for (const m of mediaRows) {
    const list = mediaByProduct.get(m.product_id) ?? []
    list.push({
      id: m.id,
      secure_url: m.secure_url,
      cloudinary_public_id: m.cloudinary_public_id,
      is_primary: m.is_primary,
      display_order: m.display_order,
    })
    mediaByProduct.set(m.product_id, list)
  }

  const categoryIds = [...new Set(rows.map((r) => r.category_id).filter(Boolean) as string[])]
  const catRows = categoryIds.length
    ? await getDb().select({ id: categories.id, name_ar: categories.name_ar }).from(categories).where(inArray(categories.id, categoryIds))
    : []
  const catMap = new Map(catRows.map((c) => [c.id, c.name_ar]))

  return rows.map<AdminProductListItem>((r) => {
    const media = mediaByProduct.get(r.id) ?? []
    const primary = media.find((m) => m.is_primary) ?? media[0]
    return {
      id: r.id,
      name_ar: r.name_ar,
      name_en: r.name_en,
      brand: r.brand,
      sku: r.sku,
      barcode: r.barcode,
      category_id: r.category_id,
      category_name: r.category_id ? (catMap.get(r.category_id) ?? null) : null,
      price: r.price,
      offer_price: r.offer_price,
      wholesale_price: r.wholesale_price,
      compare_at_price: r.compare_at_price,
      unit: r.unit,
      stock: r.stock,
      min_stock: r.min_stock,
      is_featured: r.is_featured,
      is_visible: r.is_visible,
      status: r.status,
      description: r.description,
      slug: r.slug,
      created_at: r.created_at,
      updated_at: r.updated_at,
      image_url: primary?.secure_url ?? null,
      media,
    }
  })
}

function orLike(column: typeof products.name_ar, query: string) {
  return or(like(column, query), like(products.name_en ?? '', query))
}

// ============================================
// PRODUCT MEDIA
// ============================================

/** Attach a media record to a product after a successful Cloudinary upload. */
export async function attachProductMedia(
  user: User,
  input: { productId: string; media: { cloudinaryPublicId: string; secureUrl: string; width?: number; height?: number; format?: string; resourceType?: 'image' | 'video' | 'auto'; alt?: string; displayOrder?: number; isPrimary?: boolean } }
) {
  assertCanWrite(user, 'products')
  const existing = await getDb().select().from(products).where(eq(products.id, input.productId)).limit(1)
  if (!existing[0]) throw new AdminCatalogError('المنتج غير موجود', 404)

const id = crypto.randomUUID()
  const ts = now()
  const isPrimary = input.media.isPrimary ?? false
  if (isPrimary) {
    // Clear existing primary flags for this product.
    await getDb().update(productMedia).set({ is_primary: false }).where(eq(productMedia.product_id, input.productId))
  }

  const [row] = await getDb().insert(productMedia).values({
    id,
    product_id: input.productId,
    cloudinary_public_id: input.media.cloudinaryPublicId,
    secure_url: input.media.secureUrl,
    width: input.media.width ?? null,
    height: input.media.height ?? null,
    format: input.media.format ?? null,
    resource_type: input.media.resourceType ?? 'image',
    alt: input.media.alt ?? null,
    display_order: input.media.displayOrder ?? 0,
    is_primary: isPrimary,
    created_at: ts,
    updated_at: ts,
  }).returning()

  await invalidateProductCache(input.productId, existing[0].slug ?? undefined)
  logger.info('Admin catalog: product media attached', { productId: input.productId, cloudinaryPublicId: input.media.cloudinaryPublicId })
  return row
}

/** Reorder / set-primary media for a product (transactional-ish). */
export async function updateProductMediaOrder(
  user: User,
  input: { productId: string; media: Array<{ id: string; displayOrder: number; isPrimary: boolean }> }
) {
  assertCanWrite(user, 'products')
  const existing = await getDb().select().from(products).where(eq(products.id, input.productId)).limit(1)
  if (!existing[0]) throw new AdminCatalogError('المنتج غير موجود', 404)

  const ids = input.media.map((m) => m.id)
  const rows = await getDb().select().from(productMedia).where(and(eq(productMedia.product_id, input.productId), inArray(productMedia.id, ids)))
  if (rows.length !== ids.length) throw new AdminCatalogError('بيانات غير صالحة', 400)

  // Clear primaries first, then apply order + primary.
  await getDb().update(productMedia).set({ is_primary: false }).where(eq(productMedia.product_id, input.productId))
  for (const m of input.media) {
    await getDb().update(productMedia)
      .set({ display_order: m.displayOrder, is_primary: m.isPrimary, updated_at: now() })
      .where(eq(productMedia.id, m.id))
  }
  await invalidateProductCache(input.productId, existing[0].slug ?? undefined)
  logger.info('Admin catalog: product media reordered', { productId: input.productId })
  return { success: true }
}

/** Delete a product media record + best-effort delete its Cloudinary asset. */
export async function deleteProductMedia(user: User, mediaId: string) {
  assertCanWrite(user, 'products')
  const row = await getDb().select().from(productMedia).where(eq(productMedia.id, mediaId)).limit(1)
  if (!row[0]) throw new AdminCatalogError('الوسائط غير موجودة', 404)
  const productId = row[0].product_id
  const product = await getDb().select().from(products).where(eq(products.id, productId)).limit(1)

  await getDb().update(productMedia).set({ deleted_at: now(), updated_at: now() }).where(eq(productMedia.id, mediaId))
  // Best-effort Cloudinary cleanup (never throws locally when not configured).
  await deleteCloudinaryAsset(row[0].cloudinary_public_id)
  await invalidateProductCache(productId, product[0]?.slug ?? undefined)
  logger.info('Admin catalog: product media deleted', { mediaId, productId })
  return { success: true }
}

// ============================================
// CATEGORY MEDIA
// ============================================

/** Attach a media record to a category after a successful Cloudinary upload. */
export async function attachCategoryMedia(
  user: User,
  input: { categoryId: string; media: { cloudinaryPublicId: string; secureUrl: string; width?: number; height?: number; format?: string; resourceType?: 'image' | 'video' | 'auto'; alt?: string; displayOrder?: number; isPrimary?: boolean } }
) {
  assertCanWrite(user, 'categories')
  const existing = await getDb().select().from(categories).where(eq(categories.id, input.categoryId)).limit(1)
  if (!existing[0]) throw new AdminCatalogError('القسم غير موجود', 404)

  const id = crypto.randomUUID()
  const ts = now()
  const isPrimary = input.media.isPrimary ?? true
  if (isPrimary) {
    await getDb().update(categoryMedia).set({ is_primary: false }).where(eq(categoryMedia.category_id, input.categoryId))
  }

  const [row] = await getDb().insert(categoryMedia).values({
    id,
    category_id: input.categoryId,
    cloudinary_public_id: input.media.cloudinaryPublicId,
    secure_url: input.media.secureUrl,
    width: input.media.width ?? null,
    height: input.media.height ?? null,
    format: input.media.format ?? null,
    resource_type: input.media.resourceType ?? 'image',
    alt: input.media.alt ?? null,
    display_order: input.media.displayOrder ?? 0,
    is_primary: isPrimary,
    created_at: ts,
    updated_at: ts,
  }).returning()

  await invalidateCategoryCache(input.categoryId, existing[0].name_ar)
  logger.info('Admin catalog: category media attached', { categoryId: input.categoryId })
  return row
}

/** Delete a category media record + best-effort delete its Cloudinary asset. */
export async function deleteCategoryMedia(user: User, mediaId: string) {
  assertCanWrite(user, 'categories')
  const row = await getDb().select().from(categoryMedia).where(eq(categoryMedia.id, mediaId)).limit(1)
  if (!row[0]) throw new AdminCatalogError('الوسائط غير موجودة', 404)
  const categoryId = row[0].category_id
  const category = await getDb().select().from(categories).where(eq(categories.id, categoryId)).limit(1)

  await getDb().update(categoryMedia).set({ deleted_at: now(), updated_at: now() }).where(eq(categoryMedia.id, mediaId))
  await deleteCloudinaryAsset(row[0].cloudinary_public_id)
  await invalidateCategoryCache(categoryId, category[0]?.name_ar)
  logger.info('Admin catalog: category media deleted', { mediaId, categoryId })
  return { success: true }
}

/** Standalone id generator (used by tests). */
export function generateId(): string {
  return nanoid(16)
}

// ============================================
// CATEGORY WRITES (ADMIN)
// ============================================

/** List every category (including hidden) for the admin table. */
export async function listCategoriesAdmin() {
  return getDb()
    .select()
    .from(categories)
    .where(isNull(categories.deleted_at))
    .orderBy(desc(categories.sort_order), desc(categories.created_at))
}

/** Create a category. Returns the created row. */
export async function createCategory(
  user: User,
  input: { nameAr: string; nameEn?: string; parentId?: string | null; image?: string; sortOrder?: number; isVisible?: boolean }
) {
  assertCanWrite(user, 'categories')
  const ts = now()
  const [row] = await getDb()
    .insert(categories)
    .values({
      id: crypto.randomUUID(),
      name_ar: input.nameAr,
      name_en: input.nameEn ?? null,
      parent_id: input.parentId ?? null,
      image: input.image ?? null,
      sort_order: input.sortOrder ?? 0,
      is_visible: input.isVisible ?? true,
      created_at: ts,
      updated_at: ts,
    })
    .returning()
  await invalidateCategoryCache(row.id, row.name_ar)
  return row
}

/** Update a category (partial). */
export async function updateCategory(
  user: User,
  id: string,
  input: { nameAr?: string; nameEn?: string; parentId?: string | null; image?: string; sortOrder?: number; isVisible?: boolean }
) {
  assertCanWrite(user, 'categories')
  const existing = await getDb().select().from(categories).where(eq(categories.id, id)).limit(1)
  if (!existing[0]) throw new AdminCatalogError('القسم غير موجود', 404)
  await getDb()
    .update(categories)
    .set({
      ...(input.nameAr !== undefined ? { name_ar: input.nameAr } : {}),
      ...(input.nameEn !== undefined ? { name_en: input.nameEn ?? null } : {}),
      ...(input.parentId !== undefined ? { parent_id: input.parentId ?? null } : {}),
      ...(input.image !== undefined ? { image: input.image ?? null } : {}),
      ...(input.sortOrder !== undefined ? { sort_order: input.sortOrder } : {}),
      ...(input.isVisible !== undefined ? { is_visible: input.isVisible } : {}),
      updated_at: now(),
    })
    .where(eq(categories.id, id))
  await invalidateCategoryCache(id, existing[0].name_ar)
  return { success: true }
}

/** Soft-delete a category. */
export async function softDeleteCategory(user: User, id: string) {
  assertCanWrite(user, 'categories')
  const existing = await getDb().select().from(categories).where(eq(categories.id, id)).limit(1)
  if (!existing[0]) throw new AdminCatalogError('القسم غير موجود', 404)
  await getDb()
    .update(categories)
    .set({ deleted_at: now(), updated_at: now(), is_visible: false })
    .where(eq(categories.id, id))
  await invalidateCategoryCache(id, existing[0].name_ar)
  return { success: true }
}
