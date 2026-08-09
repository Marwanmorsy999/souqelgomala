/**
 * Database Index — single entry point for DB access.
 *
 * Re-exports schema, types, and the client factory. Application code
 * should import exclusively from here or from the repositories layer.
 */

// Schema
export * from './schema'

// Client
export { createDb, createTestDb, getDb, runMigrations } from './client'
export type { Db, CreateDbOptions, D1DatabaseLike } from './client'

// Lazy singleton for convenience (used by API routes).
// Implemented as a Proxy so importing `@/db` never throws when the D1 binding
// is absent (e.g. plain-Node unit tests); the binding is resolved on first use.
import { getDb as _getDb } from './client'
import type { Db } from './client'

export const db = new Proxy({} as Db, {
  get: (_target, prop) => {
    const instance = _getDb()
    const value = (instance as unknown as Record<string | symbol, unknown>)[prop]
    return typeof value === 'function' ? value.bind(instance) : value
  },
})
