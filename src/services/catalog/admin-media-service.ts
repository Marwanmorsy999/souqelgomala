/**
 * Admin media library service.
 */

import { getDb } from '@/db'
import { mediaLibrary } from '@/db/schema/media'
import type { User } from '@/services/auth'
import { hasPermission, type Role } from '@/lib/permissions'
import { eq, desc, like, or, and, isNull, inArray, sql } from 'drizzle-orm'
import { invalidateCatalogCache } from '@/services/catalog/service'
import { logger } from '@/lib/logger'
import { mediaLibrarySchema, type MediaLibraryInput } from '@/lib/validations'

export class AdminMediaError extends Error {
  constructor(message: string, public status = 400) {
    super(message)
    this.name = 'AdminMediaError'
  }
}

export function assertCanWriteMedia(user: User): void {
  if (!hasPermission(user.role as Role, 'media.write')) {
    throw new AdminMediaError('ليس لديك صلاحية لإدارة الوسائط', 403)
  }
}

function now(): string {
  return new Date().toISOString()
}

export async function listMediaAdmin(opts: { search?: string; tag?: string; unused?: boolean } = {}) {
  const conditions: unknown[] = []
  if (opts.search?.trim()) {
    const q = `%${opts.search.trim()}%`
    conditions.push(or(like(mediaLibrary.filename, q), like(mediaLibrary.alt_text ?? '', q)))
  }
  if (opts.tag?.trim()) {
    conditions.push(like(mediaLibrary.tags, `%${opts.tag.trim()}%`))
  }
  if (opts.unused) {
    conditions.push(eq(mediaLibrary.usage_count, 0))
  }
  const where = conditions.length ? and(...conditions as never[]) : undefined
  return getDb()
    .select()
    .from(mediaLibrary)
    .where(where)
    .orderBy(desc(mediaLibrary.uploaded_at))
}

export async function createMediaRecord(user: User, input: MediaLibraryInput) {
  assertCanWriteMedia(user)
  const parsed = mediaLibrarySchema.parse(input)
  const ts = now()
  const [row] = await getDb()
    .insert(mediaLibrary)
    .values({
      id: crypto.randomUUID(),
      url: parsed.url,
      cloudinary_public_id: parsed.cloudinaryPublicId,
      filename: parsed.filename,
      alt_text: parsed.altText ?? null,
      tags: JSON.stringify(parsed.tags ?? []),
      uploaded_by: user.id,
      uploaded_at: ts,
    })
    .returning()
  logger.info('Admin media: record created', { id: row.id, by: user.id })
  return row
}

export async function updateMediaUsageCount(mediaId: string, delta: number) {
  await getDb()
    .update(mediaLibrary)
    .set({ usage_count: sql`${mediaLibrary.usage_count} + ${delta}` })
    .where(eq(mediaLibrary.id, mediaId))
}

export async function softDeleteMedia(user: User, id: string) {
  assertCanWriteMedia(user)
  const existing = await getDb().select().from(mediaLibrary).where(eq(mediaLibrary.id, id)).limit(1)
  if (!existing[0]) throw new AdminMediaError('الوسيط غير موجود', 404)
  if ((existing[0].usage_count ?? 0) > 0) {
    throw new AdminMediaError('لا يمكن حذف وسيط مستخدم حالياً', 409)
  }
  await getDb().delete(mediaLibrary).where(eq(mediaLibrary.id, id))
  logger.info('Admin media: record deleted', { id, by: user.id })
  return { success: true }
}
