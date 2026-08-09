/**
 * Cloudflare Integration Types (Future-Ready)
 *
 * These interfaces define how Cloudflare services will integrate.
 * They are NOT implemented yet — they prepare the architecture.
 */

// ============================================
// R2 (Object Storage) — Future
// ============================================

export interface R2StorageAdapter {
  put(key: string, body: ReadableStream | ArrayBuffer | string, options?: R2PutOptions): Promise<R2Object>
  get(key: string): Promise<R2Object | null>
  delete(key: string): Promise<void>
  list(prefix?: string): Promise<R2Object[]>
}

interface R2PutOptions {
  contentType?: string
  cacheControl?: string
  httpMetadata?: Record<string, string>
}

interface R2Object {
  key: string
  size: number
  contentType: string
  body: ReadableStream
}

// ============================================
// KV (Key-Value Store) — Future
// ============================================

export interface KVStoreAdapter {
  get(key: string): Promise<string | null>
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
  delete(key: string): Promise<void>
}

// ============================================
// QUEUES — Future
// ============================================

export interface QueueProducer {
  send(message: unknown, options?: { delaySeconds?: number }): Promise<void>
}

export interface QueueConsumer {
  process(message: unknown): Promise<void>
}

// ============================================
// TURNSTILE (Captcha)
// ============================================

export interface TurnstileVerifyRequest {
  token: string
  remoteIp?: string
}

export interface TurnstileVerifyResponse {
  success: boolean
  'error-codes'?: string[]
  challenge_ts?: string
  hostname?: string
}

// ============================================
// CACHE & WAF
// ============================================

export interface CacheControlOptions {
  browserTTL?: number
  edgeTTL?: number
  cacheEverything?: boolean
}

export interface WafRuleOptions {
  ruleId: string
  action: 'block' | 'challenge' | 'allow'
  expression: string
}

