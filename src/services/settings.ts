/**
 * Settings service — admin-managed business info persisted to D1.
 *
 * The storefront business info (name, phones, WhatsApp, address, social links,
 * hero content) historically lived in `lib/site.ts`. This service moves that
 * content into the D1 `settings` table (key = `site`, value = JSON) with the
 * lib/site.ts values as the DEFAULT fallback, so nothing is ever empty.
 *
 *   storefront/client   →  GET /api/site  →  getSiteSettings()  (KV cached)
 *   admin               →  GET/PUT /api/admin/settings
 *
 * KV is only a cache — the D1 row is the source of truth. Every write upserts
 * the merged settings and invalidates the cache so the storefront picks the
 * change up on its next fetch.
 */

import { getDb } from '@/db'
import { settings } from '@/db/schema/operations'
import { eq } from 'drizzle-orm'
import {
  kvGetJSON,
  kvPutJSON,
  invalidateCache,
  CACHE_KEYS,
} from '@/lib/cloudflare/kv'
import {
  normalizeSiteSettings,
  DEFAULT_SITE_SETTINGS,
  type SiteSettings,
} from '@/lib/site-settings'
import { hasPermission, type Role } from '@/lib/permissions'
import { logger } from '@/lib/logger'
import type { User } from '@/services/auth'
import type { SiteSettingsInput } from '@/lib/validations'

export const SITE_SETTINGS_KEY = 'site'
export const SETTINGS_CACHE_KEY = CACHE_KEYS.SETTINGS(SITE_SETTINGS_KEY)

const SETTINGS_TTL = 300 // 5 minutes

export class SettingsError extends Error {
  constructor(message: string, public status = 400) {
    super(message)
    this.name = 'SettingsError'
  }
}

function now(): string {
  return new Date().toISOString()
}

/** Assert the user may write settings; throws 403 otherwise. */
export function assertCanWriteSettings(user: User): void {
  if (!hasPermission(user.role as Role, 'settings.write')) {
    throw new SettingsError('ليس لديك صلاحية لتعديل الإعدادات', 403)
  }
}

/**
 * Read the stored raw JSON payload for a settings key (empty object when absent).
 * Used internally; the storefront-facing API always uses `getSiteSettings()`.
 */
async function readSettingRaw(key: string): Promise<Record<string, unknown>> {
  try {
    const [row] = await getDb()
      .select()
      .from(settings)
      .where(eq(settings.key, key))
      .limit(1)
    if (!row?.value) return {}
    return JSON.parse(row.value) as Record<string, unknown>
  } catch (err) {
    logger.warn('Settings: failed to read setting row', { key, error: err })
    return {}
  }
}

/** Upsert a settings row (key/value JSON). */
async function writeSettingRaw(
  key: string,
  value: Record<string, unknown>,
): Promise<void> {
  const ts = now()
  const raw = JSON.stringify(value)
  const [existing] = await getDb()
    .select({ id: settings.id })
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1)

  if (existing) {
    await getDb()
      .update(settings)
      .set({ value: raw, updated_at: ts })
      .where(eq(settings.id, existing.id))
  } else {
    await getDb().insert(settings).values({
      id: crypto.randomUUID(),
      key,
      value: raw,
      description: 'Site settings (business info + homepage hero content)',
      created_at: ts,
      updated_at: ts,
    })
  }
}

/**
 * Merged site settings for the storefront (defaults + D1 overrides), KV cached.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  const cached = await kvGetJSON<SiteSettings>(SETTINGS_CACHE_KEY)
  if (cached) return normalizeSiteSettings(cached)

  const raw = await readSettingRaw(SITE_SETTINGS_KEY)
  const merged = normalizeSiteSettings(raw)
  await kvPutJSON(SETTINGS_CACHE_KEY, merged, { ttl: SETTINGS_TTL })
  return merged
}

/**
 * Admin update — persists the merged site settings to D1 and invalidates the KV
 * cache so the storefront refetches from D1 (source of truth).
 */
export async function updateSiteSettings(
  user: User,
  patch: Partial<SiteSettingsInput>,
): Promise<SiteSettings> {
  assertCanWriteSettings(user)

  const currentRaw = await readSettingRaw(SITE_SETTINGS_KEY)
  const next = normalizeSiteSettings({ ...currentRaw, ...(patch ?? {}) })

  try {
    await writeSettingRaw(SITE_SETTINGS_KEY, next as unknown as Record<string, unknown>)
  } catch (err) {
    logger.error('Settings: failed to persist site settings', { error: err })
    throw new SettingsError('تعذر حفظ الإعدادات', 500)
  }

  await invalidateCache(SETTINGS_CACHE_KEY)
  logger.info('Settings: site settings updated', { by: user.id })

  // Return the merged object so the UI can confirm what was saved.
  return normalizeSiteSettings(next as unknown as Record<string, unknown>)
}

/** Export the default settings for tests / reset flows. */
export { DEFAULT_SITE_SETTINGS }