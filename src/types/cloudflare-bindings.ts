/**
 * Minimal structural types for Cloudflare Workers bindings.
 *
 * These mirror the shape of the real bindings (D1, KV, R2, Queues) WITHOUT
 * pulling the full `@cloudflare/workers-types` globals into the Next.js app
 * program (which would conflict with the DOM lib). The runtime binding objects
 * are structurally compatible with these interfaces.
 */

/** Cloudflare KV namespace */
export interface KvBinding {
  get(key: string): Promise<string | null>
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number; metadata?: Record<string, unknown> }
  ): Promise<void>
  delete(key: string): Promise<void>
}

/** Cloudflare Queue (producer side) */
export interface QueueBinding {
  send(message: unknown): Promise<void>
}

/** Cloudflare R2 bucket */
export interface R2BucketBinding {
  put(
    key: string,
    value: Uint8Array,
    options?: {
      httpMetadata?: { contentType?: string }
      customMetadata?: Record<string, string>
    }
  ): Promise<unknown>
  head(key: string): Promise<{ etag?: string } | null>
  delete(key: string): Promise<void>
  get(key: string): Promise<unknown | null>
  getSignedUrl?(options: { key: string; expires?: number }): Promise<string>
}

/** Cloudflare D1 database */
export interface D1Binding {
  prepare(query: string): {
    bind(...params: unknown[]): unknown
    all(): Promise<unknown>
    first(): Promise<unknown | null>
    run(): Promise<unknown>
  }
  dump(): Promise<ArrayBuffer>
  batch(statements: unknown[]): Promise<unknown[]>
}

/**
 * Read a binding from the Workers runtime global scope.
 * Returns undefined when the binding is absent (e.g. local tests, plain Node).
 */
export function getWorkersBinding<T>(name: string): T | undefined {
  return (globalThis as Record<string, unknown>)[name] as T | undefined
}