/**
 * Shim conformance test (harness self-test).
 *
 * Proves the fixed local D1 shim correctly supports the exact operations the
 * production Drizzle services rely on, BEFORE trusting any CRUD verification:
 *
 *   1. eq(column, value)              5. bind(...params).first()
 *   2. inArray(column, values)        6. bind(...params).all()
 *   3. .first()                       7. mapResultRow positional mapping
 *   4. .all()                            (incl. joins w/ duplicate col names)
 */
import path from 'node:path'
import { drizzle } from 'drizzle-orm/d1'
import { eq, inArray, and, isNull } from 'drizzle-orm'
import { createD1Shim } from './lib/d1-shim.ts'
import * as schema from '@/db/schema'
import { products, categories } from '@/db/schema/catalog'

const DB_PATH = path.resolve(
  '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/e30bf897014d7857d1d837c5f3a6a249694380206214385f3c666aa64ebe8f14.sqlite',
)

let pass = 0
let fail = 0
function check(name: string, ok: boolean, detail?: unknown) {
  if (ok) pass++
  else fail++
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}${detail !== undefined ? ' | ' + JSON.stringify(detail) : ''}`)
}

async function main() {
  const { DB } = createD1Shim(DB_PATH)
  const db = drizzle(DB as never, { schema, logger: false })

  const fixtures = (await DB.prepare('select id, name_ar from products limit 3').all()).results as Array<{
    id: string
    name_ar: string
  }>
  const ids = fixtures.map((f) => f.id)
  console.log('fixtures:', ids)

  // 1. eq()
  const eqRows = await db.select().from(products).where(eq(products.id, ids[0])).limit(1)
  check('1. Drizzle eq(column, value) returns row with real id', eqRows[0]?.id === ids[0], {
    id: eqRows[0]?.id,
    name_ar: eqRows[0]?.name_ar,
  })

  // 2. inArray()
  const inRows = await db.select().from(products).where(inArray(products.id, ids))
  const inIds = inRows.map((r) => r.id).sort()
  check(
    '2. Drizzle inArray(column, values) returns all rows with real ids',
    inIds.length === ids.length && inIds.every((v, i) => v === [...ids].sort()[i]),
    { expected: [...ids].sort(), got: inIds },
  )

  // 2b. inArray with a projection (fields subset)
  const inProj = await db
    .select({ id: products.id, name_ar: products.name_ar })
    .from(products)
    .where(inArray(products.id, ids))
  check(
    '2b. inArray with projection maps id + name_ar',
    inProj.length === ids.length && inProj.every((r) => !!r.id && typeof r.name_ar === 'string'),
    inProj.map((r) => r.id),
  )

  // 3. .first() via raw binding
  const firstRow = (await DB.prepare('select id, name_ar from products where id = ?')
    .bind(ids[0])
    .first()) as Record<string, unknown> | null
  check('3. .bind(param).first() preserves the parameter', firstRow?.id === ids[0], firstRow)

  // 3b. .first() must return null (not throw) for no match
  const firstNone = await DB.prepare('select id from products where id = ?').bind('__nope__').first()
  check('3b. .first() returns null when no row matches', firstNone === null, firstNone)

  // 3c. .first(colName)
  const firstCol = await DB.prepare('select name_ar from products where id = ?').bind(ids[0]).first('name_ar')
  check('3c. .first(colName) returns the scalar column', typeof firstCol === 'string', firstCol)

  // 4. .all()
  const allRes = await DB.prepare('select id from products where id in (?, ?)').bind(ids[0], ids[1]).all()
  check('4. .bind(...).all() returns both rows', allRes.results.length === 2, allRes.results)

  // 5/6. Direct-parameter style (prepare(sql).all(...params) / .first(...params))
  const directAll = await DB.prepare('select id from products where id = ?').all(ids[0])
  check('5. prepare(sql).all(...params) works', directAll.results.length === 1, directAll.results)
  const directFirst = (await DB.prepare('select id from products where id = ?').first(ids[0])) as
    | Record<string, unknown>
    | null
  check('6. prepare(sql).first(...params) works', directFirst?.id === ids[0], directFirst)

  // 7. mapResultRow — join with DUPLICATE column names (id appears twice)
  const joined = await db
    .select({
      productId: products.id,
      productName: products.name_ar,
      categoryId: categories.id,
      categoryName: categories.name_ar,
    })
    .from(products)
    .leftJoin(categories, eq(categories.id, products.category_id))
    .where(and(isNull(products.deleted_at)))
    .limit(3)
  check(
    '7. mapResultRow: join with duplicate column names maps positionally',
    joined.length > 0 && joined.every((r) => typeof r.productId === 'string' && r.productId.length > 0),
    joined.map((r) => ({ p: r.productId?.slice(0, 8), c: r.categoryId?.slice(0, 8), cn: r.categoryName })),
  )

  // 7b. Full-row select must expose every real column name
  const full = await db.select().from(products).where(eq(products.id, ids[0])).limit(1)
  const row = full[0] as Record<string, unknown>
  check(
    '7b. full row exposes real column names (id, name_ar, price, created_at)',
    !!row && typeof row.id === 'string' && 'name_ar' in row && 'price' in row && 'created_at' in row,
    { id: row?.id, price: row?.price },
  )

  // 8. Writes must apply EXACTLY once (old shim double-executed via bind()).
  await DB.prepare('CREATE TABLE IF NOT EXISTS __shim_probe (id text primary key, n integer)').run()
  await DB.prepare('DELETE FROM __shim_probe').run()
  await DB.prepare('INSERT INTO __shim_probe (id, n) VALUES (?, ?)').bind('a', 1).run()
  await DB.prepare('UPDATE __shim_probe SET n = n + 1 WHERE id = ?').bind('a').run()
  const probe = (await DB.prepare('SELECT n FROM __shim_probe WHERE id = ?').bind('a').first()) as {
    n: number
  } | null
  check('8. writes apply exactly once (no double-execution via bind)', probe?.n === 2, probe)
  await DB.prepare('DROP TABLE __shim_probe').run()

  // 9. Drizzle insert().returning() must produce the inserted row
  const tmpId = crypto.randomUUID()
  const ts = new Date().toISOString()
  const [ret] = await db
    .insert(categories)
    .values({ id: tmpId, name_ar: 'SHIMPROBE', name_en: 'shim', created_at: ts, updated_at: ts })
    .returning()
  check('9. insert().returning() returns row with real id', ret?.id === tmpId, { id: ret?.id })
  await DB.prepare('DELETE FROM categories WHERE id = ?').bind(tmpId).run()

  console.log(`\n===== SHIM CONFORMANCE: ${pass} passed, ${fail} failed =====`)
  process.exit(fail === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error('SHIM TEST FATAL', e)
  process.exit(1)
})
