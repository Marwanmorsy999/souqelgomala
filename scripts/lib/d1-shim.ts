/**
 * Local D1 binding shim (TEST HARNESS ONLY — not application code).
 *
 * Emulates the Cloudflare D1 `D1Database` binding on top of the real local
 * miniflare SQLite file using `node:sqlite`, so the PRODUCTION Drizzle
 * services can run unmodified in Node during verification.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY THE PREVIOUS SHIM FAILED (all defects were in the shim, not the app):
 *
 * 1. `raw()` returned ROW OBJECTS.
 *    Drizzle's D1 driver implements `.values()` as `stmt.bind(...p).raw()`,
 *    and every `select({...})`/`select()` with fields goes through `values()`.
 *    Drizzle then maps results with `mapResultRow(fields, row, ...)` which
 *    indexes rows POSITIONALLY (`row[columnIndex]`). Given an object, every
 *    positional lookup yielded `undefined`, so `id` came back undefined/null.
 *    → THIS was the true cause of "rows have id === undefined".
 *
 * 2. `bind()` eagerly executed the query.
 *    The old shim ran `allSql(query, params)` inside `bind()`. That made
 *    INSERT/UPDATE/DELETE run at bind time via `.all()`, and made `.run()`
 *    execute the statement a SECOND time (double-applied writes).
 *
 * 3. `Object.values(row)` is NOT a safe substitute for positional rows.
 *    `node:sqlite` object rows COLLAPSE duplicate column names — verified:
 *    `select p.id, c.id, p.name_ar ...` returns only 2 keys, silently
 *    dropping a column and shifting every later position. Drizzle joins
 *    select duplicate names constantly. We therefore use the real positional
 *    API `StatementSync.setReturnArrays(true)`.
 *
 * 4. `first()`/`all()` "losing parameters" was a misdiagnosis.
 *    Drizzle passes params to `bind(...)`, then calls `.raw()`/`.all()` with
 *    NO arguments — that is correct D1 semantics. The shim must therefore
 *    retain bound params on the statement. Direct `all(...params)` /
 *    `first(...params)` are also supported here for completeness.
 *
 * Real D1 semantics implemented:
 *   - prepare(sql).bind(...p).all()   → { results, success, meta }
 *   - prepare(sql).bind(...p).first() → first row object | null
 *   - prepare(sql).bind(...p).first(col) → single column value | null
 *   - prepare(sql).bind(...p).raw()   → positional arrays (what Drizzle uses)
 *   - prepare(sql).bind(...p).run()   → { success, meta }
 *   - prepare(sql).all(...p) / .first(...p) / .run(...p) / .raw(...p)
 *   - batch([...]) executed in a transaction
 */

import { DatabaseSync, type StatementSync } from 'node:sqlite'

export interface ShimOptions {
  /** Emit SQL + params + mapped-row diagnostics. */
  trace?: boolean
}

export interface D1Meta {
  duration: number
  changes: number
  last_row_id: number
  rows_read: number
  rows_written: number
}

type SqlValue = null | number | bigint | string | Uint8Array

/** D1 only accepts primitives; normalise JS values the way the real binding does. */
function normalizeParam(value: unknown): SqlValue {
  if (value === undefined || value === null) return null
  if (typeof value === 'boolean') return value ? 1 : 0
  if (value instanceof Date) return value.toISOString()
  if (value instanceof Uint8Array) return value
  if (typeof value === 'bigint') return value
  if (typeof value === 'number' || typeof value === 'string') return value
  return JSON.stringify(value)
}

function normalizeParams(params: readonly unknown[]): SqlValue[] {
  return params.map(normalizeParam)
}

export function createD1Shim(dbPath: string, options: ShimOptions = {}) {
  const sqlite = new DatabaseSync(dbPath)
  sqlite.exec('PRAGMA foreign_keys = ON;')

  const trace = (label: string, payload: unknown) => {
    if (options.trace) {
      console.log(`      [d1shim] ${label} :: ${JSON.stringify(payload, null, 0)?.slice(0, 400)}`)
    }
  }

  const isReadQuery = (sql: string): boolean => {
    const head = sql.replace(/^\s*(?:\/\*[\s\S]*?\*\/|--[^\n]*\n)*\s*/, '').slice(0, 12).toLowerCase()
    return head.startsWith('select') || head.startsWith('with') || head.startsWith('pragma')
  }
  /** INSERT/UPDATE/DELETE ... RETURNING must be executed as a read to yield rows. */
  const hasReturning = (sql: string): boolean => /\breturning\b/i.test(sql)

  const meta = (changes: number, lastRowId: number, rowsRead: number): D1Meta => ({
    duration: 0,
    changes,
    last_row_id: lastRowId,
    rows_read: rowsRead,
    rows_written: changes,
  })

  /** Execute returning positional arrays — exactly what Drizzle `.values()` needs. */
  function execRaw(sql: string, params: readonly unknown[]): unknown[][] {
    const stmt: StatementSync = sqlite.prepare(sql)
    stmt.setReturnArrays(true)
    const rows = stmt.all(...(normalizeParams(params) as never[])) as unknown as unknown[][]
    trace('raw()', { sql: sql.slice(0, 120), params, rowCount: rows.length, firstRow: rows[0] })
    return rows
  }

  /** Execute returning row objects (real column names). */
  function execAll(sql: string, params: readonly unknown[]): Record<string, unknown>[] {
    const stmt: StatementSync = sqlite.prepare(sql)
    const rows = stmt.all(...(normalizeParams(params) as never[])) as Record<string, unknown>[]
    trace('all()', { sql: sql.slice(0, 120), params, rowCount: rows.length, firstRow: rows[0] })
    return rows
  }

  function execRun(sql: string, params: readonly unknown[]) {
    // Statements with RETURNING must go through all() to actually produce rows.
    if (hasReturning(sql) || isReadQuery(sql)) {
      const rows = execAll(sql, params)
      return { results: rows, success: true as const, meta: meta(rows.length, 0, rows.length) }
    }
    const stmt: StatementSync = sqlite.prepare(sql)
    const info = stmt.run(...(normalizeParams(params) as never[]))
    trace('run()', { sql: sql.slice(0, 120), params, changes: Number(info.changes) })
    return {
      results: [],
      success: true as const,
      meta: meta(Number(info.changes), Number(info.lastInsertRowid), 0),
    }
  }

  function makeStatement(sql: string, bound: readonly unknown[]) {
    /**
     * Resolve params for a call. Drizzle calls `.all()` / `.raw()` / `.first()`
     * with NO arguments after `.bind(...)`, so bound params must win. Direct
     * `.all(...params)` (no prior bind) is also supported.
     */
    const resolve = (callArgs: readonly unknown[]): readonly unknown[] =>
      callArgs.length > 0 ? callArgs : bound

    const statement = {
      bind(...params: unknown[]) {
        trace('bind()', { sql: sql.slice(0, 120), params })
        // Pure: does NOT execute. Returns a new statement carrying the params.
        return makeStatement(sql, params)
      },

      async all(...args: unknown[]) {
        const params = resolve(args)
        const rows = execAll(sql, params)
        return { results: rows, success: true as const, meta: meta(0, 0, rows.length) }
      },

      async first(...args: unknown[]) {
        // Real D1: first(colName?) — a single string arg selects one column.
        let colName: string | undefined
        let params = args
        if (args.length === 1 && typeof args[0] === 'string' && bound.length > 0) {
          colName = args[0] as string
          params = []
        }
        const rows = execAll(sql, resolve(params))
        const row = rows[0] ?? null
        trace('first()', { sql: sql.slice(0, 120), params: resolve(params), colName, row })
        if (row === null) return null
        return colName !== undefined ? ((row[colName] ?? null) as unknown) : row
      },

      async raw(...args: unknown[]) {
        return execRaw(sql, resolve(args))
      },

      async run(...args: unknown[]) {
        return execRun(sql, resolve(args))
      },
    }
    return statement
  }

  const DB = {
    prepare(sql: string) {
      return makeStatement(sql, [])
    },
    async batch(statements: Array<{ run: () => Promise<unknown> }>) {
      sqlite.exec('BEGIN')
      try {
        const out: unknown[] = []
        for (const s of statements) out.push(await s.run())
        sqlite.exec('COMMIT')
        return out
      } catch (e) {
        sqlite.exec('ROLLBACK')
        throw e
      }
    },
    async exec(sql: string) {
      sqlite.exec(sql)
      return { count: 0, duration: 0 }
    },
    async dump() {
      return new ArrayBuffer(0)
    },
  }

  return { DB, sqlite }
}
