/**
 * Admin API AUTH / RBAC verification — drives the REAL Next.js route handlers.
 *
 * Unlike the service-level RBAC checks in verify-crud.ts, this exercises the
 * full HTTP boundary:
 *   unauthenticated  → 401
 *   authenticated owner → 2xx
 *   authenticated employee on a write route → 403
 *
 * `next/headers` cookies() requires a request scope, so we invoke the handlers
 * inside Next's AsyncLocalStorage work-unit store, which is exactly what the
 * framework does per-request. No authentication logic is weakened or bypassed:
 * the session token is a REAL session row created by the real
 * `createSession()`, and the handler resolves it via the real
 * `getUserFromSession()`.
 */

// MUST be first: installs globalThis.AsyncLocalStorage before next/* loads.
import './lib/next-runtime-bootstrap.ts'

import path from 'node:path'
import { AsyncLocalStorage } from 'node:async_hooks'
import { createD1Shim } from './lib/d1-shim.ts'

const DB_PATH = path.resolve(
  '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/e30bf897014d7857d1d837c5f3a6a249694380206214385f3c666aa64ebe8f14.sqlite',
)
const { DB, sqlite } = createD1Shim(DB_PATH)
const kvStore = new Map<string, string>()
;(globalThis as Record<string, unknown>).DB = DB
;(globalThis as Record<string, unknown>).CACHE = {
  get: async (k: string) => kvStore.get(k) ?? null,
  put: async (k: string, v: string) => void kvStore.set(k, v),
  delete: async (k: string) => void kvStore.delete(k),
}

let pass = 0
let fail = 0
let blocked = 0
function check(name: string, ok: boolean, detail?: unknown) {
  if (ok) pass++
  else fail++
  console.log(
    `${ok ? 'PASS' : 'FAIL'}    | AUTH-API   | ${name}${detail !== undefined ? ' | ' + JSON.stringify(detail) : ''}`,
  )
}
function block(name: string, why: string) {
  blocked++
  console.log(`BLOCKED | AUTH-API   | ${name} | ${why}`)
}

/**
 * Run a handler inside a minimal Next.js request scope so `cookies()` works.
 *
 * `cookies()` reads BOTH `workAsyncStorage` (the route/work store) and
 * `workUnitAsyncStorage` (the per-request store); both must be populated.
 */
async function withRequestScope<T>(cookieHeader: string, fn: () => Promise<T>): Promise<T> {
  const workUnitMod = await import('next/dist/server/app-render/work-unit-async-storage.external.js')
  const workMod = await import('next/dist/server/app-render/work-async-storage.external.js')
  const workUnitStorage = (workUnitMod as { workUnitAsyncStorage: AsyncLocalStorage<unknown> })
    .workUnitAsyncStorage
  const workStorage = (workMod as { workAsyncStorage: AsyncLocalStorage<unknown> }).workAsyncStorage

  const cookieMap = new Map<string, { name: string; value: string }>()
  for (const part of cookieHeader.split(';').map((s) => s.trim()).filter(Boolean)) {
    const idx = part.indexOf('=')
    const name = part.slice(0, idx)
    cookieMap.set(name, { name, value: part.slice(idx + 1) })
  }

  const mutableCookies = {
    get: (n: string) => cookieMap.get(n),
    getAll: () => [...cookieMap.values()],
    has: (n: string) => cookieMap.has(n),
    set: () => mutableCookies,
    delete: () => mutableCookies,
    size: cookieMap.size,
    [Symbol.iterator]: () => cookieMap.values(),
  }

  const workStore = {
    route: '/api/admin',
    page: '/api/admin',
    isStaticGeneration: false,
    forceStatic: false,
    forceDynamic: true,
    dynamicShouldError: false,
    isDraftMode: false,
    isRevalidate: false,
    fetchCache: undefined,
    incrementalCache: undefined,
    isBuildTimePrerendering: false,
    pendingRevalidates: undefined,
    pendingRevalidateWrites: undefined,
    afterContext: undefined,
    dynamicIOEnabled: false,
    dev: false,
    invalidDynamicUsageError: undefined,
    rootParams: {},
  }

  const workUnitStore = {
    type: 'request',
    phase: 'action',
    implicitTags: { tags: [], expirations: [] },
    url: { pathname: '/api/admin', search: '' },
    rootParams: {},
    cookies: mutableCookies,
    mutableCookies,
    userspaceMutableCookies: mutableCookies,
    headers: new Headers({ cookie: cookieHeader }),
    draftMode: { isEnabled: false },
    devFallbackParams: null,
    isHmrRefresh: false,
    serverComponentsHmrCache: undefined,
    devWarnedAboutSyncDynamicAPIs: true,
    prerenderResumeDataCache: null,
    renderResumeDataCache: null,
  }

  return workStorage.run(workStore as never, () =>
    workUnitStorage.run(workUnitStore as never, fn),
  )
}

async function main() {
  const { createSession, deleteSession } = await import('@/services/auth')

  // Locate a real owner and (optionally) a lower-privileged profile in D1.
  const owner = sqlite
    .prepare("select id, email, role from profiles where role = 'owner' limit 1")
    .all()[0] as { id: string; email: string; role: string } | undefined

  if (!owner) {
    block('all API auth checks', 'no owner profile exists in local D1 (seed required)')
    console.log(`\n═══ AUTH-API: ${pass} passed, ${fail} failed, ${blocked} blocked ═══`)
    return
  }

  const productsRoute = await import('../app/api/admin/products/route.ts')
  const settingsRoute = await import('../app/api/admin/settings/route.ts')
  const { NextRequest } = await import('next/server')

  // ── 1. UNAUTHENTICATED → 401 ───────────────────────────────────────────
  try {
    const res = await withRequestScope('', () =>
      productsRoute.GET(new NextRequest('http://localhost/api/admin/products') as never),
    )
    check('GET /api/admin/products unauthenticated → 401', res.status === 401, { status: res.status })
  } catch (e) {
    block('unauthenticated → 401', String(e).slice(0, 200))
  }

  try {
    const res = await withRequestScope('', () =>
      productsRoute.POST(
        new NextRequest('http://localhost/api/admin/products', {
          method: 'POST',
          body: JSON.stringify({ nameAr: 'X', price: 1, unit: 'كيلو', stock: 1 }),
          headers: { 'content-type': 'application/json' },
        }) as never,
      ),
    )
    check('POST /api/admin/products unauthenticated → 401', res.status === 401, { status: res.status })
  } catch (e) {
    block('unauthenticated POST → 401', String(e).slice(0, 200))
  }

  try {
    // NOTE: the settings GET handler takes no request argument.
    const res = await withRequestScope('', () => settingsRoute.GET())
    check('GET /api/admin/settings unauthenticated → 401', res.status === 401, { status: res.status })
  } catch (e) {
    block('unauthenticated settings → 401', String(e).slice(0, 200))
  }

  // ── 2. INVALID SESSION TOKEN → 401 ─────────────────────────────────────
  try {
    const res = await withRequestScope('souk_session=totally-invalid-token', () =>
      productsRoute.GET(new NextRequest('http://localhost/api/admin/products') as never),
    )
    check('GET with FORGED session cookie → 401', res.status === 401, { status: res.status })
  } catch (e) {
    block('forged cookie → 401', String(e).slice(0, 200))
  }

  // ── 3. AUTHENTICATED OWNER → success ───────────────────────────────────
  let ownerToken: string | undefined
  try {
    const { token } = await createSession(owner.id)
    ownerToken = token
    const res = await withRequestScope(`souk_session=${token}`, () =>
      productsRoute.GET(new NextRequest('http://localhost/api/admin/products') as never),
    )
    const body = (await res.json()) as { success?: boolean; data?: unknown[] }
    check('GET /api/admin/products as OWNER → 200 + data', res.status === 200 && body.success === true, {
      status: res.status,
      rows: Array.isArray(body.data) ? body.data.length : null,
    })
  } catch (e) {
    block('authenticated owner GET', String(e).slice(0, 300))
  }

  // ── 4. AUTHENTICATED OWNER can write, and it PERSISTS ──────────────────
  if (ownerToken) {
    try {
      const nameAr = `API-VERIFY-${Date.now()}`
      const res = await withRequestScope(`souk_session=${ownerToken}`, () =>
        productsRoute.POST(
          new NextRequest('http://localhost/api/admin/products', {
            method: 'POST',
            body: JSON.stringify({ nameAr, price: 12, unit: 'كيلو', stock: 3 }),
            headers: { 'content-type': 'application/json' },
          }) as never,
        ),
      )
      const body = (await res.json()) as { success?: boolean; data?: { id?: string } }
      const createdId = body?.data?.id
      check('POST /api/admin/products as OWNER → created', res.status >= 200 && res.status < 300 && !!createdId, {
        status: res.status,
        id: createdId,
      })
      const row = sqlite.prepare('select id, price from products where name_ar = ?').all(nameAr)[0] as
        | { id: string; price: number }
        | undefined
      check('API-created product PERSISTED in D1', row?.price === 12, row)
      if (row) sqlite.prepare('delete from products where id = ?').run(row.id)
    } catch (e) {
      block('authenticated owner POST', String(e).slice(0, 300))
    }

    // ── 5. VALIDATION still enforced on an authenticated request ─────────
    try {
      const res = await withRequestScope(`souk_session=${ownerToken}`, () =>
        productsRoute.POST(
          new NextRequest('http://localhost/api/admin/products', {
            method: 'POST',
            body: JSON.stringify({ price: -5 }), // missing nameAr, negative price
            headers: { 'content-type': 'application/json' },
          }) as never,
        ),
      )
      check('POST invalid payload as OWNER → 4xx validation error', res.status >= 400 && res.status < 500, {
        status: res.status,
      })
    } catch (e) {
      block('validation check', String(e).slice(0, 200))
    }
  }

  // ── 6. EMPLOYEE (low privilege) → 403 on write route ───────────────────
  const empId = '10000000-0000-0000-0000-0000000000ee'
  let createdEmployee = false
  try {
    const existing = sqlite.prepare('select id from profiles where id = ?').all(empId)[0]
    if (!existing) {
      const ts = new Date().toISOString()
      sqlite
        .prepare(
          'insert into profiles (id, email, full_name, role, is_active, created_at, updated_at) values (?,?,?,?,?,?,?)',
        )
        .run(empId, `emp-verify@test.local`, 'Verify Employee', 'employee', 1, ts, ts)
      createdEmployee = true
    }
    const { token } = await createSession(empId)
    const res = await withRequestScope(`souk_session=${token}`, () =>
      productsRoute.POST(
        new NextRequest('http://localhost/api/admin/products', {
          method: 'POST',
          body: JSON.stringify({ nameAr: 'EMP-SHOULD-FAIL', price: 1, unit: 'كيلو', stock: 1 }),
          headers: { 'content-type': 'application/json' },
        }) as never,
      ),
    )
    check('POST /api/admin/products as EMPLOYEE → 403', res.status === 403, { status: res.status })

    const leaked = sqlite.prepare('select id from products where name_ar = ?').all('EMP-SHOULD-FAIL')
    check('forbidden write did NOT persist anything', leaked.length === 0, { rows: leaked.length })

    // Employee CAN read products (products.read is granted)
    const readRes = await withRequestScope(`souk_session=${token}`, () =>
      productsRoute.GET(new NextRequest('http://localhost/api/admin/products') as never),
    )
    check('GET /api/admin/products as EMPLOYEE → 200 (read permitted)', readRes.status === 200, {
      status: readRes.status,
    })

    // Employee must NOT write settings
    const setRes = await withRequestScope(`souk_session=${token}`, () =>
      settingsRoute.PUT(
        new NextRequest('http://localhost/api/admin/settings', {
          method: 'PUT',
          body: JSON.stringify({ phoneMain: '01000000000' }),
          headers: { 'content-type': 'application/json' },
        }) as never,
      ),
    )
    check('PUT /api/admin/settings as EMPLOYEE → 403', setRes.status === 403, { status: setRes.status })

    await deleteSession(token)
  } catch (e) {
    block('employee RBAC via API', String(e).slice(0, 300))
  } finally {
    if (createdEmployee) {
      sqlite.prepare('delete from sessions where profile_id = ?').run(empId)
      sqlite.prepare('delete from profiles where id = ?').run(empId)
    }
  }

  if (ownerToken) await deleteSession(ownerToken)

  console.log(`\n═══ AUTH-API: ${pass} passed, ${fail} failed, ${blocked} blocked ═══`)
  process.exit(fail === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error('AUTH HARNESS FATAL', e)
  process.exit(1)
})
