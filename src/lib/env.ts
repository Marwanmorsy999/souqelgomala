/**
 * Environment Configuration
 *
 * Centralized, type-safe access to environment variables.
 *
 * Usage: `import { env } from '@/lib/env'`
 * Never access `process.env` directly in components.
 *
 * Cloudflare bindings are injected at runtime by the Workers runtime
 * and are NOT exposed to the browser.
 */

import { z } from 'zod'
import type { D1Binding, KvBinding, R2BucketBinding, QueueBinding } from '@/types/cloudflare-bindings'

// ============================================
// SCHEMA
// ============================================

const envSchema = z.object({
  // --- App (client-safe) ---
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default('Souk El Gomla'),
  NEXT_PUBLIC_APP_LOCALE: z.string().min(1).default('ar-EG'),
NEXT_PUBLIC_APP_CURRENCY: z.string().min(1).default('EGP'),

  // --- Turnstile (site key is public, secret is server-only) ---
  NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY: z.string().optional(),
  CLOUDFLARE_TURNSTILE_SECRET_KEY: z.string().optional(),

  // --- Cloudinary (public cloud name is client-safe; api key/secret are server-only) ---
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // --- Application secret (server-only) ---
  // Used for signing/deriving tokens that must survive across restarts.
  SESSION_SECRET: z.string().optional(),

  // --- Drizzle D1 tooling (dev machine only, not bundled) ---
  CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
  CLOUDFLARE_DATABASE_ID: z.string().optional(),
  CLOUDFLARE_D1_TOKEN: z.string().optional(),

  // --- Misc ---
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

// ============================================
// PARSING
// ============================================

/**
 * Safely read process.env without throwing when a key is absent,
 * so Zod can produce the complete list of problems at once.
 */
function readEnv(): Record<string, string | undefined> {
  return process.env ?? {}
}

const parsed = envSchema.safeParse(readEnv())

if (!parsed.success) {
  const problems = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n')
  throw new Error(`[env] Invalid environment configuration:\n${problems}`)
}

const resolved = parsed.data

// ============================================
// DERIVED VALUES
// ============================================

/** Whether we're running a browser bundle. */
const isBrowser = typeof window !== 'undefined'

// ============================================
// EXPORT
// ============================================

export const env = {
  // App
  NEXT_PUBLIC_APP_URL: resolved.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_APP_NAME: resolved.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_LOCALE: resolved.NEXT_PUBLIC_APP_LOCALE,
  NEXT_PUBLIC_APP_CURRENCY: resolved.NEXT_PUBLIC_APP_CURRENCY,

// Cloudflare Turnstile (public site key only)
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: resolved.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY ?? '',

  // Cloudinary (public cloud name — client-safe, used for CDN delivery URLs)
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME:
    resolved.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? resolved.CLOUDINARY_CLOUD_NAME ?? '',

  // Server-only Cloudinary credentials (never bundled to client).
  get CLOUDINARY_CLOUD_NAME(): string {
    assertServerOnly()
    const binding = (globalThis as Record<string, unknown>).CLOUDINARY_CLOUD_NAME
    if (typeof binding === 'string' && binding) return binding
    const v = process.env.CLOUDINARY_CLOUD_NAME
    if (!v) throw new Error('CLOUDINARY_CLOUD_NAME is not set')
    return v
  },
  get CLOUDINARY_API_KEY(): string {
    assertServerOnly()
    const binding = (globalThis as Record<string, unknown>).CLOUDINARY_API_KEY
    if (typeof binding === 'string' && binding) return binding
    const v = process.env.CLOUDINARY_API_KEY
    if (!v) throw new Error('CLOUDINARY_API_KEY is not set')
    return v
  },
  get CLOUDINARY_API_SECRET(): string {
    assertServerOnly()
    const binding = (globalThis as Record<string, unknown>).CLOUDINARY_API_SECRET
    if (typeof binding === 'string' && binding) return binding
    const v = process.env.CLOUDINARY_API_SECRET
    if (!v) throw new Error('CLOUDINARY_API_SECRET is not set')
    return v
  },

  // Server-only secrets — accessed via getters, not bundled to client
  get TURNSTILE_SECRET(): string {
    assertServerOnly()
    const binding = (globalThis as Record<string, unknown>).TURNSTILE_SECRET_KEY
    if (typeof binding === 'string' && binding) return binding
    const v = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY
    if (!v) throw new Error('TURNSTILE_SECRET_KEY / CLOUDFLARE_TURNSTILE_SECRET_KEY is not set')
    return v
  },

  // Application secret for durable token derivation (server-only).
  get SESSION_SECRET(): string {
    assertServerOnly()
    const binding = (globalThis as Record<string, unknown>).SESSION_SECRET
    if (typeof binding === 'string' && binding) return binding
    const v = process.env.SESSION_SECRET
    if (!v) throw new Error('SESSION_SECRET is not set')
    return v
  },

  // Cloudflare D1 binding (set by OpenNext / wrangler)
  get DB(): D1Binding {
    assertServerOnly()
    return (globalThis as Record<string, unknown>).DB as unknown as D1Binding
  },

  // Cloudflare KV binding
  get CACHE(): KvBinding {
    assertServerOnly()
    const v = (globalThis as Record<string, unknown>).CACHE
    if (!v) throw new Error('CACHE (KV) binding not available')
    return v as unknown as KvBinding
  },

  // Cloudflare R2 bucket bindings
  get PRODUCTS_BUCKET(): R2BucketBinding {
    return getR2BucketBinding('PRODUCTS_BUCKET')
  },
  get CATEGORIES_BUCKET(): R2BucketBinding {
    return getR2BucketBinding('CATEGORIES_BUCKET')
  },
  get OFFERS_BUCKET(): R2BucketBinding {
    return getR2BucketBinding('OFFERS_BUCKET')
  },
  get PROFILES_BUCKET(): R2BucketBinding {
    return getR2BucketBinding('PROFILES_BUCKET')
  },
  get BRANCHES_BUCKET(): R2BucketBinding {
    return getR2BucketBinding('BRANCHES_BUCKET')
  },

  // Cloudflare QueueBinding bindings
  get ORDER_QUEUE(): QueueBinding {
    assertServerOnly()
    const v = (globalThis as Record<string, unknown>).ORDER_QUEUE
    if (!v) throw new Error('ORDER_QUEUE binding not available')
    return v as unknown as QueueBinding
  },
  get NOTIFICATION_QUEUE(): QueueBinding {
    assertServerOnly()
    const v = (globalThis as Record<string, unknown>).NOTIFICATION_QUEUE
    if (!v) throw new Error('NOTIFICATION_QUEUE binding not available')
    return v as unknown as QueueBinding
  },

  // Runtime
  NODE_ENV: resolved.NODE_ENV,
  IS_BROWSER: isBrowser,
  IS_PROD: resolved.NODE_ENV === 'production',
  IS_DEV: resolved.NODE_ENV !== 'production',
} as const

export type Env = typeof env

/**
 * Assert that this code runs on the server, not in the browser.
 */
export function assertServerOnly(): void {
  if (typeof window !== 'undefined') {
    throw new Error(
      'This code accesses server-only Cloudflare bindings and must not run in the browser. ' +
      'Ensure it is called from a Server Action, Route Handler, or server component.'
    )
  }
}

/**
 * Get an R2 bucket binding, falling back to local stub in tests.
 */
function getR2BucketBinding(name: string): R2BucketBinding {
  assertServerOnly()
  const v = (globalThis as Record<string, unknown>)[name]
  if (!v) throw new Error(`${name} binding not available`)
  return v as unknown as R2BucketBinding
}



