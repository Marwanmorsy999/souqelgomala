/**
 * Admin promos service — write path for content slots.
 */

import { getDb } from '@/db'
import { promoSlots } from '@/db/schema/promos'
import type { User } from '@/services/auth'
import { hasPermission, type Role } from '@/lib/permissions'
import { eq, desc, isNull, and, sql } from 'drizzle-orm'
import { invalidateCatalogCache } from '@/services/catalog/service'
import { logger } from '@/lib/logger'
import { createPromoSchema, updatePromoSchema, type CreatePromoInput, type UpdatePromoInput } from '@/lib/validations'
import type { PromoPlacement } from '@/db/schema/promos'

export class AdminPromoError extends Error {
  constructor(message: string, public status = 400) {
    super(message)
    this.name = 'AdminPromoError'
  }
}

export function assertCanWritePromos(user: User): void {
  if (!hasPermission(user.role as Role, 'promos.write')) {
    throw new AdminPromoError('ليس لديك صلاحية لإدارة المحتوى', 403)
  }
}

function now(): string {
  return new Date().toISOString()
}

export async function listPromosAdmin(opts: { placement?: PromoPlacement } = {}) {
  const conditions: unknown[] = [isNull(promoSlots.deleted_at)]
  if (opts.placement) conditions.push(eq(promoSlots.placement, opts.placement as PromoPlacement))
  return getDb()
    .select()
    .from(promoSlots)
    .where(and(...conditions as never[]))
    .orderBy(desc(promoSlots.sort_order), desc(promoSlots.created_at))
}

export async function createPromo(user: User, input: CreatePromoInput) {
  assertCanWritePromos(user)
  const parsed = createPromoSchema.parse(input)
  const id = crypto.randomUUID()
  const ts = now()
  const [row] = await getDb()
    .insert(promoSlots)
    .values({
      id,
      placement: parsed.placement,
      category_id: parsed.categoryId ?? null,
      image_url: parsed.imageUrl,
      title: parsed.title,
      subtitle: parsed.subtitle ?? null,
      cta_text: parsed.ctaText ?? null,
      cta_link: parsed.ctaLink ?? null,
      start_at: parsed.startAt,
      end_at: parsed.endAt,
      active: parsed.active,
      sort_order: parsed.sortOrder,
      publish_status: parsed.publishStatus,
      frequency: parsed.frequency,
      created_by: user.id,
      created_at: ts,
      updated_at: ts,
    })
    .returning()
  await invalidateCatalogCache()
  logger.info('Admin promos: promo created', { id, placement: parsed.placement, by: user.id })
  return row
}

export async function updatePromo(user: User, id: string, input: UpdatePromoInput) {
  assertCanWritePromos(user)
  const parsed = updatePromoSchema.parse(input)
  const existing = await getDb().select().from(promoSlots).where(eq(promoSlots.id, id)).limit(1)
  if (!existing[0]) throw new AdminPromoError('البانر غير موجود', 404)

  await getDb()
    .update(promoSlots)
    .set({
      ...(parsed.placement !== undefined ? { placement: parsed.placement } : {}),
      ...(parsed.categoryId !== undefined ? { category_id: parsed.categoryId ?? null } : {}),
      ...(parsed.imageUrl !== undefined ? { image_url: parsed.imageUrl } : {}),
      ...(parsed.title !== undefined ? { title: parsed.title } : {}),
      ...(parsed.subtitle !== undefined ? { subtitle: parsed.subtitle ?? null } : {}),
      ...(parsed.ctaText !== undefined ? { cta_text: parsed.ctaText ?? null } : {}),
      ...(parsed.ctaLink !== undefined ? { cta_link: parsed.ctaLink ?? null } : {}),
      ...(parsed.startAt !== undefined ? { start_at: parsed.startAt } : {}),
      ...(parsed.endAt !== undefined ? { end_at: parsed.endAt } : {}),
      ...(parsed.active !== undefined ? { active: parsed.active } : {}),
      ...(parsed.sortOrder !== undefined ? { sort_order: parsed.sortOrder } : {}),
      ...(parsed.publishStatus !== undefined ? { publish_status: parsed.publishStatus } : {}),
      ...(parsed.frequency !== undefined ? { frequency: parsed.frequency } : {}),
      updated_at: now(),
    })
    .where(eq(promoSlots.id, id))
  await invalidateCatalogCache()
  logger.info('Admin promos: promo updated', { id, by: user.id })
  return { success: true }
}

export async function softDeletePromo(user: User, id: string) {
  assertCanWritePromos(user)
  const existing = await getDb().select().from(promoSlots).where(eq(promoSlots.id, id)).limit(1)
  if (!existing[0]) throw new AdminPromoError('البانر غير موجود', 404)
  await getDb().update(promoSlots).set({ deleted_at: now(), updated_at: now(), active: false }).where(eq(promoSlots.id, id))
  await invalidateCatalogCache()
  logger.info('Admin promos: promo deleted', { id, by: user.id })
  return { success: true }
}
