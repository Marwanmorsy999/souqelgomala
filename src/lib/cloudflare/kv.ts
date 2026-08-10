/**
 * Cloudflare KV Abstraction
 *
 * KV is used for:
 *   - Cached feature flags (fast read, low write frequency)
 *   - Short-lived session cache
 *   - Frequently accessed store settings
 *
 * D1 remains the source of truth for relational business data.
 * KV is a cache layer — if a key is missing, fall back to D1 and
 * repopulate KV.
 */

import { logger } from '@/lib/logger'
import type { KvBinding } from '@/types/cloudflare-bindings'

const CACHE_PREFIX = 'souk-el-gomla:'
const DEFAULT_TTL = 3600 // 1 hour in seconds

export interface KVEntryOptions {
  /** TTL in seconds; defaults to DEFAULT_TTL */
  ttl?: number
  /** Metadata to store alongside the value */
  metadata?: Record<string, unknown>
}

/**
 * Safely get the KV namespace binding.
 * Returns null in test environments where the binding is not set.
 */
function getCache(): KvBinding | null {
  const fromContext = (globalThis as Record<symbol, unknown>)[Symbol.for('__cloudflare-context__')] as
    | { env?: Record<string, unknown> }
    | undefined
  const ns = (fromContext?.env?.CACHE ?? (globalThis as Record<string, unknown>).CACHE) as KvBinding | undefined
  if (!ns) return null
  return ns
}

/**
 * Read a value from KV. Returns null if not found or if KV is unavailable.
 */
export async function kvGet(key: string): Promise<string | null> {
  const ns = getCache()
  if (!ns) {
    logger.warn('KV: CACHE binding not available')
    return null
  }
  try {
    return await ns.get(`${CACHE_PREFIX}${key}`)
  } catch (err) {
    logger.error('KV: get failed', { key, error: err })
    return null
  }
}

/**
 * Read and parse a JSON value from KV.
 */
export async function kvGetJSON<T = unknown>(key: string): Promise<T | null> {
  const raw = await kvGet(key)
  if (raw === null) return null
  try {
    return JSON.parse(raw) as T
  } catch (err) {
    logger.warn('KV: JSON parse failed', { key, error: err })
    return null
  }
}

/**
 * Write a value to KV.
 */
export async function kvPut(key: string, value: string, opts?: KVEntryOptions): Promise<void> {
  const ns = getCache()
  if (!ns) {
    logger.warn('KV: CACHE binding not available, skipping put')
    return
  }
  const ttl = opts?.ttl ?? DEFAULT_TTL
  try {
    await ns.put(`${CACHE_PREFIX}${key}`, value, {
      expirationTtl: ttl,
      metadata: opts?.metadata,
    })
  } catch (err) {
    logger.error('KV: put failed', { key, error: err })
  }
}

/**
 * Write a JSON value to KV.
 */
export async function kvPutJSON(key: string, value: unknown, opts?: KVEntryOptions): Promise<void> {
  return kvPut(key, JSON.stringify(value), opts)
}

/**
 * Delete a key from KV.
 */
export async function kvDelete(key: string): Promise<void> {
  const ns = getCache()
  if (!ns) {
    logger.warn('KV: CACHE binding not available, skipping delete')
    return
  }
  try {
    await ns.delete(`${CACHE_PREFIX}${key}`)
  } catch (err) {
    logger.error('KV: delete failed', { key, error: err })
  }
}

/**
 * Cache helper: getOrSet pattern.
 * If key exists in KV, return it. Otherwise, call `fn` to generate
 * the value, store it in KV, and return it.
 */
export async function kvGetOrSet<T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  const cached = await kvGetJSON<T>(key)
  if (cached !== null) {
    return cached
  }
  const fresh = await fn()
  await kvPutJSON(key, fresh, { ttl })
  return fresh
}

/**
 * Convenience: store feature flags in KV with a short TTL
 * (they are checked frequently but can tolerate brief staleness).
 */
export async function cacheFeatureFlags(flags: Record<string, boolean>, ttl: number = 300): Promise<void> {
  await kvPutJSON('feature_flags', flags, { ttl })
}

/**
 * Convenience: read feature flags from KV cache.
 */
export async function getCachedFeatureFlags(): Promise<Record<string, boolean> | null> {
  return kvGetJSON<Record<string, boolean>>('feature_flags')
}

/**
 * Central cache-key registry. Use these instead of ad-hoc strings so
 * invalidation is consistent across the codebase.
 */
export const CACHE_KEYS = {
  FEATURE_FLAGS: 'feature_flags',
  SETTINGS: (key: string) => `settings:${key}`,
  DASHBOARD: (name: string) => `dashboard:${name}`,
  PRODUCTS: (scope: string) => `products:${scope}`,
  ORDERS: (scope: string) => `orders:${scope}`,
  CATEGORIES: 'categories',
  OFFERS: 'offers',
  SOCIAL: 'catalog:social',
} as const

/**
 * Invalidate a set of cache keys. Call after any mutation that affects the
 * corresponding aggregates so consumers refetch from D1 (source of truth).
 */
export async function invalidateCache(...keys: string[]): Promise<void> {
  await Promise.all(keys.map((key) => kvDelete(key)))
}

/**
 * Invalidate every dashboard aggregate after an order/product write.
 */
export async function invalidateDashboardCache(): Promise<void> {
  await invalidateCache(
    CACHE_KEYS.DASHBOARD('orders'),
    CACHE_KEYS.DASHBOARD('totals'),
    CACHE_KEYS.ORDERS('recent'),
    CACHE_KEYS.ORDERS('count')
  )
}

