/**
 * Drizzle Client Factory
 *
 * Creates a Drizzle ORM database instance from a **Cloudflare D1 binding**
 * (production on Cloudflare Workers, and local `wrangler dev`).
 *
 * D1 is SQLite-compatible, so the schema/query model is identical everywhere.
 * There is no better-sqlite3 / Node-only database path.
 */

import { drizzle } from 'drizzle-orm/d1'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import * as schema from './schema'
import { logger } from '@/lib/logger'

export type Db = DrizzleD1Database<typeof schema>

export interface CreateDbOptions {
  /** D1 binding from Cloudflare Workers runtime */
  d1Binding: D1DatabaseLike
}

/**
 * Minimal interface for a Cloudflare D1 binding.
 * In production this is provided by `@cloudflare/workers-types`.
 */
export interface D1DatabaseLike {
  prepare(query: string): {
    bind(...params: unknown[]): { all: () => Promise<{ results: unknown[] }> }
    all(): Promise<{ results: unknown[] }>
    first(): Promise<unknown | null>
    run(): Promise<{ success: boolean }>
  }
  dump(): Promise<ArrayBuffer>
  batch(statements: string[]): Promise<unknown[]>
}

/**
 * Create a Drizzle DB instance.
 *
 * Uses D1 binding (Cloudflare Workers runtime).
 */
export function createDb(options: CreateDbOptions): Db {
  const { d1Binding } = options
  const db = drizzle(d1Binding, { schema, logger: false })
  logger.info('Drizzle: connected to D1', { mode: 'd1' })
  return db
}

/**
 * Migrate the database. 
 * Note: D1 migrations must be applied via `wrangler d1 migrations apply` or drizzle-kit.
 */
export async function runMigrations(_db: Db): Promise<void> {
  logger.warn('runMigrations: use drizzle-kit or wrangler for D1 migrations')
}

/**
 * Internal: create a database instance from a D1 binding (for testing).
 */
export function createTestDb(d1Binding: D1DatabaseLike): Db {
  return createDb({ d1Binding })
}

let _db: Db | null = null

/**
 * Singleton accessor for the application DB.
 * Uses the DB binding from Cloudflare runtime.
 */
export function getDb(): Db {
  if (!_db) {
    const dbBinding = (globalThis as Record<string, unknown>).DB as D1DatabaseLike | undefined
    if (!dbBinding) {
      throw new Error('D1 database binding (DB) is not available. Ensure wrangler.jsonc is configured.')
    }
    _db = createDb({ d1Binding: dbBinding })
  }
  return _db
}
