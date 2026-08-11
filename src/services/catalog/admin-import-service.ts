/**
 * Admin import service — bulk product operations + import tracking.
 */

import { getDb } from '@/db'
import { products, productMedia, importJobs, dealHistory } from '@/db/schema'

import type { User } from '@/services/auth'
import { hasPermission, type Role } from '@/lib/permissions'
import { eq, inArray, isNull, and, desc } from 'drizzle-orm'
import type { ImportStatus } from '@/db/schema'
import { invalidateCatalogCache, invalidateProductCache } from '@/services/catalog/service'
import { logger } from '@/lib/logger'
import { bulkActionSchema, type BulkActionInput } from '@/lib/validations'

export class AdminImportError extends Error {
  constructor(message: string, public status = 400) {
    super(message)
    this.name = 'AdminImportError'
  }
}

export function assertCanImport(user: User): void {
  if (!hasPermission(user.role as Role, 'imports.write')) {
    throw new AdminImportError('ليس لديك صلاحية لاستيراد البيانات', 403)
  }
}

function now(): string {
  return new Date().toISOString()
}

// ============================================
// BULK ACTIONS
// ============================================

export async function bulkUpdateProducts(user: User, input: BulkActionInput) {
  assertCanImport(user)
  const parsed = bulkActionSchema.parse(input)
  const ids = parsed.productIds
  const rows = await getDb().select().from(products).where(inArray(products.id, ids)).limit(500)
  if (rows.length === 0) throw new AdminImportError('لم يتم العثور على منتجات', 404)

  const affected: string[] = []

  switch (parsed.action) {
    case 'price_adjust': {
      const adj = parsed.payload!.priceAdjust!
      for (const r of rows) {
        const newPrice = adj.mode === 'fixed' ? r.price + adj.value : r.price * (1 + adj.value / 100)
        await getDb().update(products).set({ price: Math.max(0, newPrice), updated_at: now() }).where(eq(products.id, r.id))
        affected.push(r.id)
      }
      break
    }
    case 'apply_deal': {
      const deal = parsed.payload!.deal!
      for (const r of rows) {
        if (deal.discountPct != null) {
          await getDb().insert(dealHistory).values({
            product_id: r.id,
            discount_pct: deal.discountPct,
            start_at: deal.startAt,
            end_at: deal.endAt,
            created_by: user.id,
            created_at: now(),
          } as never)
          logger.info('Admin import: deal applied', { productId: r.id })
          affected.push(r.id)
        }
      }
      break
    }
    case 'remove_deal': {
      // Mark existing active deals as ended now
      await getDb().update(dealHistory).set({ end_at: now() }).where(inArray(dealHistory.product_id, ids)).returning()
      affected.push(...ids)
      break
    }
    case 'stock_update': {
      const stock = parsed.payload!.stock!
      for (const r of rows) {
        const newStock = stock.mode === 'add' ? r.stock + stock.value : stock.value
        await getDb().update(products).set({ stock: Math.max(0, newStock), updated_at: now() }).where(eq(products.id, r.id))
        affected.push(r.id)
      }
      break
    }
    case 'status_change': {
      const status = parsed.payload!.status!
      await getDb().update(products).set({ status, updated_at: now() }).where(inArray(products.id, ids))
      affected.push(...ids)
      break
    }
    case 'category_reassign': {
      const categoryId = parsed.payload!.categoryId
      await getDb().update(products).set({ category_id: categoryId ?? null, updated_at: now() }).where(inArray(products.id, ids))
      affected.push(...ids)
      break
    }
    case 'delete': {
      await getDb().update(products).set({ deleted_at: now(), is_visible: false, status: 'inactive', updated_at: now() }).where(inArray(products.id, ids))
      affected.push(...ids)
      break
    }
  }

  await invalidateCatalogCache()
  for (const id of affected) {
    await invalidateProductCache(id)
  }
  logger.info('Admin import: bulk action completed', { action: parsed.action, count: affected.length, by: user.id })
  return { success: true, affectedCount: affected.length }
}

// ============================================
// IMPORT JOBS
// ============================================

export async function createImportJob(user: User, input: { type: 'excel' | 'csv' | 'pdf'; filename: string }) {
  assertCanImport(user)
  const ts = now()
  const [job] = await getDb()
    .insert(importJobs)
    .values({
      id: crypto.randomUUID(),
      type: input.type,
      filename: input.filename,
      uploaded_by: user.id,
      created_at: ts,
    })
    .returning()
  logger.info('Admin import: job created', { jobId: job.id, type: input.type, by: user.id })
  return job
}

export async function listImportJobs() {
  return getDb().select().from(importJobs).orderBy(desc(importJobs.created_at)).limit(100)
}

export async function updateImportJobStatus(jobId: string, patch: { status?: ImportStatus; rowCount?: number; errorCount?: number; errorLog?: string | null }) {
  const setPayload: Record<string, unknown> = {}
  if (patch.status !== undefined) setPayload.status = patch.status
  if (patch.rowCount !== undefined) setPayload.row_count = patch.rowCount
  if (patch.errorCount !== undefined) setPayload.error_count = patch.errorCount
  if (patch.errorLog !== undefined) setPayload.error_log = patch.errorLog
  await getDb().update(importJobs).set(setPayload).where(eq(importJobs.id, jobId))
}

export async function commitImportJob(jobId: string, opts: { skipErrors?: boolean } = {}) {
  const job = await getDb().select().from(importJobs).where(eq(importJobs.id, jobId)).limit(1)
  if (!job[0]) throw new AdminImportError('Import job not found', 404)
  if (job[0].status !== 'validated') throw new AdminImportError('Job is not validated yet', 400)
  const errorLog = job[0].error_log ? (JSON.parse(job[0].error_log) as string[]) : []
  if (!opts.skipErrors && errorLog.length > 0) {
    throw new AdminImportError(`Job has ${errorLog.length} validation errors` , 400)
  }
  await updateImportJobStatus(jobId, { status: 'committed' })
  logger.info('Admin import: job committed', { jobId, by: 'system' })
  return { success: true, jobId }
}
