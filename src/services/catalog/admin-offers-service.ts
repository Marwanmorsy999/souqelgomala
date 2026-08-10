/**
 * Admin offers service — write path for daily-offer campaigns.
 *
 * Mirrors the admin catalog service pattern: server-side RBAC
 * (`offers.write`), Zod-validated input, D1 mutation, KV cache
 * invalidation so the storefront "🔥 عروض النهارده" section refetches
 * from D1 (source of truth).
 *
 * Schema: the D1 `offers` table (see src/db/schema/offers.ts).
 * `product_ids` is a JSON text column holding product UUIDs.
 */

import { getDb } from '@/db'
import { offers } from '@/db/schema/offers'
import { products } from '@/db/schema/catalog'
import type { User } from '@/services/auth'
import { hasPermission, type Role } from '@/lib/permissions'
import { eq, desc, isNull, inArray, sql } from 'drizzle-orm'
import { invalidateCache, CACHE_KEYS } from '@/lib/cloudflare/kv'
import { logger } from '@/lib/logger'
import type { AdminOfferInput } from '@/lib/validations'

export class AdminOfferError extends Error {
  constructor(message: string, public status = 400) {
    super(message)
    this.name = 'AdminOfferError'
  }
}

export function assertCanWriteOffers(user: User): void {
  if (!hasPermission(user.role as Role, 'offers.write')) {
    throw new AdminOfferError('ليس لديك صلاحية لإدارة العروض', 403)
  }
}

function now(): string {
  return new Date().toISOString()
}

export function parseOfferProductIds(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

/** Invalidate every offer-scoped cache key so the storefront refetches. */
async function invalidateOffersCache(): Promise<void> {
  await invalidateCache(
    CACHE_KEYS.OFFERS,
    'catalog:featured',
    'catalog:best-sellers',
    'catalog:discounted',
    CACHE_KEYS.PRODUCTS('*'),
  )
}

/**
 * Ensure the `is_featured` column exists on the `offers` table.
 *
 * This column was added after the initial schema (migration 0004). To keep the
 * admin "mark as featured" control working even if the migration hasn't been
 * applied through the journal yet, we attempt the additive ALTER once per
 * process. The statement is idempotent — a duplicate-column error is ignored.
 */
let ensuredFeatured = false
async function ensureFeaturedColumn(): Promise<void> {
  if (ensuredFeatured) return
  try {
    await getDb().run(
      sql.raw(
        `ALTER TABLE offers ADD COLUMN is_featured integer DEFAULT false NOT NULL`,
      ),
    )
  } catch {
    // Column already exists (or migration 0004 already applied) — safe to ignore.
  }
  ensuredFeatured = true
}

/** Every non-deleted offer for the admin table (products resolved). */
export async function listOffersAdmin() {
  await ensureFeaturedColumn()
  const rows = await getDb()
    .select()
    .from(offers)
    .where(isNull(offers.deleted_at))
    .orderBy(desc(offers.start_date))

  const productIds = [...new Set(rows.flatMap((r) => parseOfferProductIds(r.product_ids)))]
  let productTitles = new Map<string, string>()
  if (productIds.length) {
    const matches = await getDb()
      .select({ id: products.id, name_ar: products.name_ar })
      .from(products)
      .where(inArray(products.id, productIds))
    productTitles = new Map(matches.map((m) => [m.id, m.name_ar]))
  }

  return rows.map((r) => {
    const ids = parseOfferProductIds(r.product_ids)
    return {
      id: r.id,
      campaign_name: r.campaign_name,
      banner: r.banner,
      discount_type: r.discount_type,
      value: r.value,
      buy_x: r.buy_x,
      get_y: r.get_y,
      product_ids: ids,
      productCount: ids.length,
      productNames: ids.map((id) => productTitles.get(id) ?? null).filter(Boolean).slice(0, 6),
      start_date: r.start_date,
      end_date: r.end_date,
      status: r.status,
      is_featured: r.is_featured,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }
  })
}

/** Create a daily-offer campaign. */
export async function createOffer(user: User, input: AdminOfferInput) {
  assertCanWriteOffers(user)
  await ensureFeaturedColumn()
  const ts = now()
  try {
    const [row] = await getDb()
      .insert(offers)
      .values({
        id: crypto.randomUUID(),
        banner: input.banner?.trim() ? input.banner.trim() : null,
        campaign_name: input.campaignName,
        discount_type: input.discountType,
        value: input.discountType === 'buy_x_get_y' ? null : (input.value ?? null),
        buy_x: input.buyX ?? null,
        get_y: input.getY ?? null,
        product_ids: JSON.stringify(input.productIds),
        start_date: input.startDate,
        end_date: input.endDate,
        status: input.status,
        is_featured: input.isFeatured ?? false,
        created_at: ts,
        updated_at: ts,
      })
      .returning()
    await invalidateOffersCache()
    logger.info('Admin offers: offer created', { id: row.id, by: user.id })
    return row
  } catch (err) {
    logger.error('Admin offers: create failed', { error: err })
    throw new AdminOfferError('تعذر إنشاء العرض', 500)
  }
}

/** Update a daily-offer campaign (partial). */
export async function updateOffer(user: User, id: string, input: Partial<AdminOfferInput>) {
  assertCanWriteOffers(user)
  await ensureFeaturedColumn()
  const existing = await getDb().select().from(offers).where(eq(offers.id, id)).limit(1)
  if (!existing[0]) throw new AdminOfferError('العرض غير موجود', 404)

  const discountType = input.discountType ?? existing[0].discount_type
  try {
    await getDb()
      .update(offers)
      .set({
        ...(input.campaignName !== undefined ? { campaign_name: input.campaignName } : {}),
        ...(input.banner !== undefined ? { banner: input.banner.trim() ? input.banner.trim() : null } : {}),
        ...(input.discountType !== undefined ? { discount_type: input.discountType } : {}),
        ...(input.value !== undefined ? { value: discountType === 'buy_x_get_y' ? null : (input.value ?? null) } : {}),
        ...(input.buyX !== undefined ? { buy_x: input.buyX ?? null } : {}),
        ...(input.getY !== undefined ? { get_y: input.getY ?? null } : {}),
        ...(input.productIds !== undefined ? { product_ids: JSON.stringify(input.productIds) } : {}),
        ...(input.startDate !== undefined ? { start_date: input.startDate } : {}),
        ...(input.endDate !== undefined ? { end_date: input.endDate } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.isFeatured !== undefined ? { is_featured: input.isFeatured } : {}),
        updated_at: now(),
      })
      .where(eq(offers.id, id))
    await invalidateOffersCache()
    logger.info('Admin offers: offer updated', { id, by: user.id })
    return { success: true }
  } catch (err) {
    logger.error('Admin offers: update failed', { id, error: err })
    throw new AdminOfferError('تعذر تحديث العرض', 500)
  }
}

/** Soft-delete a daily-offer campaign. */
export async function softDeleteOffer(user: User, id: string) {
  assertCanWriteOffers(user)
  const existing = await getDb().select().from(offers).where(eq(offers.id, id)).limit(1)
  if (!existing[0]) throw new AdminOfferError('العرض غير موجود', 404)
  await getDb()
    .update(offers)
    .set({ deleted_at: now(), updated_at: now(), status: 'inactive' })
    .where(eq(offers.id, id))
  await invalidateOffersCache()
  logger.info('Admin offers: offer deleted', { id, by: user.id })
  return { success: true }
}