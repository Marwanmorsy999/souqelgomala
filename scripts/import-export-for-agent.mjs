/**
 * Import the richer Kheir Zaman export (export_for_agent/) into the Souk El
 * Gomla D1 catalog as a COMPLETE REPLACE.
 *
 * Differences from the old scrape (scripts/seed-scraped-products.mjs):
 *   - 476 Arabic categories (categories.json) with real name_ar.
 *   - 7,026 products with BOTH English and Arabic names (name_ar often null).
 *   - product_categories.json mapping is mostly useless (22 English paths that
 *     don't match the Arabic category tree), so products are linked to
 *     categories via products.json `category_ar` === categories.name_ar.
 *
 * ID scheme (text PKs, to avoid clashing with seeded 10000000-/20000000- rows):
 *   category id : kzcat-<numeric id>
 *   product  id : kz-<numeric id>
 *
 * Images: the prior seed already uploaded every image to Cloudinary folder
 * "products" with public_id "product-<id>". These are the SAME images/products,
 * so we REUSE the existing Cloudinary URLs instead of re-uploading 310MB. The
 * prior product_media rows are captured (mode `capture`) before the delete and
 * replayed. A deterministic fallback URL is used only for products with no
 * captured row but a local image file.
 *
 * Product -> category mapping:
 *   products.json `category_ar` matches exactly one categories.name_ar. A given
 *   name_ar may appear at several levels; we pick the LEVEL-1 row (top-level
 *   storefront grouping) when present, else the first occurrence.
 *
 * Usage:
 *   node scripts/import-export-for-agent.mjs capture <local|prod>
 *   node scripts/import-export-for-agent.mjs import  <local|prod>
 */

import { readFileSync, writeFileSync, existsSync, statSync, mkdtempSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = resolve(__dirname, '..')
const EXPORT_DIR = 'D:/kheirzaman_scraper/export_for_agent'
const CATEGORIES_JSON = join(EXPORT_DIR, 'categories.json')
const PRODUCTS_JSON = join(EXPORT_DIR, 'products.json')
const PRODUCT_CATEGORIES_JSON = join(EXPORT_DIR, 'product_categories.json')
const IMAGES_DIR = join(EXPORT_DIR, 'images')
const MEDIA_CACHE = join(ROOT, 'scripts', '.media-cache.json')

const MODE = process.argv[2] || 'import'
const TARGET_ARG = process.argv[3] || 'prod'
// 'local' -> local sqlite via wrangler; 'prod' -> D1 HTTP API (needs token);
// 'prod-remote' -> wrangler d1 execute --remote --file (uses OAuth login).
const TARGET = TARGET_ARG === 'local' ? 'local' : TARGET_ARG === 'prod-remote' ? 'prod-remote' : 'prod'
const DB_NAME = 'souk-el-gomla-prod'
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || 'd2209cdaa4e0bfe7fc1cb4bc0bb8b84e'
const CF_D1_TOKEN = process.env.CLOUDFLARE_D1_TOKEN || process.env.D1_HTTP_TOKEN || process.env.CLOUDFLARE_OAUTH_TOKEN
const CF_D1_DB = process.env.CLOUDFLARE_DATABASE_ID || '0dc1da7c-cfc1-425e-868a-c3c740b44935'
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'pg7nqahy'

const now = () => new Date().toISOString()
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function sqlStr(v) {
  if (v === null || v === undefined) return 'NULL'
  return `'${String(v).replace(/'/g, "''")}'`
}
function parsePrice(raw) {
  const n = parseFloat(String(raw).replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) ? n : 0
}
function normalizeUnit(raw) {
  const s = (raw || '').toString().trim()
  if (!s || s === 'piece') return 'piece'
  const MAP = [
    [/(كيلو|kg|كلغ|كيلوجرام|kilo)/i, 'KG'],
    [/(جرام|جم|g|gram|غرام)/i, 'G'],
    [/(علبة|عبوة|زجاجة|باكت|باكيت|packet|box|bottle|can|علب)/i, 'PACK'],
    [/(كرتونة|كرتون|carton)/i, 'CARTON'],
    [/(حبة|قطعة|piece|حبات|قطع)/i, 'PIECE'],
    [/(رول|لفة|roll)/i, 'ROLL'],
  ]
  for (const [re, norm] of MAP) if (re.test(s)) return norm
  return 'PIECE'
}
function imageExists(id) {
  for (const ext of ['.jpg', '.jpeg', '.png', '.JPG', '.PNG']) {
    if (statSync(join(IMAGES_DIR, `${id}${ext}`), { throwIfNoEntry: false })) return `${id}${ext}`
  }
  return null
}

// ---------------------------------------------------------------------------
// D1 execution
// ---------------------------------------------------------------------------
const D1_API = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_D1_DB}/query`

async function d1ExecHttp(sql) {
  let lastErr
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(D1_API, {
        method: 'POST',
        headers: { Authorization: `Bearer ${CF_D1_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(JSON.stringify(json.errors || json))
      return json.result
    } catch (e) {
      lastErr = e
      await sleep(500 * (attempt + 1))
    }
  }
  throw lastErr
}

async function d1ExecLocal(sql) {
  const dir = mkdtempSync(join(tmpdir(), 'imp-'))
  const tmp = join(dir, 'batch.sql')
  writeFileSync(tmp, sql)
  const wranglerBin = join(ROOT, 'node_modules', '.bin', 'wrangler')
  const cmd = process.platform === 'win32' ? `${wranglerBin}.cmd` : wranglerBin
  return execFileSync(cmd, ['d1', 'execute', 'DB', '--local', '--file', tmp], {
    cwd: ROOT, encoding: 'utf8', shell: process.platform === 'win32',
  })
}

async function d1Exec(sql) {
  if (TARGET === 'local') return d1ExecLocal(sql)
  // Prod: D1 HTTP API accepts multiple statements in a single query.
  return d1ExecHttp(sql)
}

// Write the SQL to chunked files and execute each (avoids single-file statement
// limits in wrangler --file and HTTP payload caps). Each chunk is its own
// wrangler invocation / HTTP POST. For TARGET==='prod-remote' we instead run
// the whole file once via `wrangler d1 execute --remote --file` (uses the
// OAuth login), which executes server-side and avoids per-batch crashes.
async function d1ExecFile(sql) {
  if (TARGET === 'prod-remote') {
    const tmp = join(ROOT, 'scripts', '.import-batch.sql')
    writeFileSync(tmp, sql)
    const wranglerBin = join(ROOT, 'node_modules', '.bin', 'wrangler')
    const cmd = process.platform === 'win32' ? `${wranglerBin}.cmd` : wranglerBin
    console.log(`[import] executing remote --file ${tmp} (single pass)`)
    return execFileSync(cmd, ['d1', 'execute', 'DB', '--remote', '--file', tmp], {
      cwd: ROOT, encoding: 'utf8', shell: process.platform === 'win32',
    })
  }
  const stmts = sql.split(';\n').map((s) => s.trim()).filter(Boolean).map((s) => s + ';')
  const CHUNK = 250
  for (let i = 0; i < stmts.length; i += CHUNK) {
    const batch = stmts.slice(i, i + CHUNK).join('\n')
    const done = Math.min(i + CHUNK, stmts.length)
    if (TARGET === 'local') {
      const dir = mkdtempSync(join(tmpdir(), 'imp-'))
      const tmp = join(dir, 'batch.sql')
      writeFileSync(tmp, batch)
      const wranglerBin = join(ROOT, 'node_modules', '.bin', 'wrangler')
      const cmd = process.platform === 'win32' ? `${wranglerBin}.cmd` : wranglerBin
      execFileSync(cmd, ['d1', 'execute', 'DB', '--local', '--file', tmp], {
        cwd: ROOT, encoding: 'utf8', shell: process.platform === 'win32',
      })
    } else {
      await d1ExecHttp(batch)
    }
    console.log(`[import] committed ${done}/${stmts.length} statements`)
  }
}

// ---------------------------------------------------------------------------
// Build category map: name_ar -> chosen category id (level-1 preferred)
// ---------------------------------------------------------------------------
function buildCategoryMap() {
  const cats = JSON.parse(readFileSync(CATEGORIES_JSON, 'utf8'))
  // Assign each of the 476 rows a unique sequential id (kzcat-<n>) because the
  // source `id` repeats across levels. Keep a name_ar -> chosen-id map for the
  // product FK (prefer the level-1 row for a given name_ar).
  const idByIndex = new Map()
  const chosen = new Map()
  cats.forEach((c, n) => {
    const cid = `kzcat-${n}`
    idByIndex.set(n, cid)
    const name = c.name_ar
    if (!chosen.has(name)) chosen.set(name, { n, level: c.level })
    else {
      const cur = chosen.get(name)
      if (c.level === 1 && cur.level !== 1) chosen.set(name, { n, level: 1 })
    }
  })
  return { cats, chosen, idByIndex }
}

// ---------------------------------------------------------------------------
// Mode: capture existing product_media before the delete
// ---------------------------------------------------------------------------
async function captureMedia() {
  console.log(`[capture] target=${TARGET}`)
  const sql = `SELECT product_id, cloudinary_public_id, secure_url, format FROM product_media;`
  let rows
  if (TARGET === 'local') {
    // wrangler local returns text; parse minimally via sqlite? Use HTTP-style fallback:
    // local path can't easily return JSON, so read via a temp approach is skipped;
    // we instead rely on the prod DB or fallback URL construction.
    throw new Error('capture requires prod target (remote DB returns JSON). Use: capture prod')
  } else {
    const res = await d1ExecHttp(sql)
    rows = res[0]?.results || []
  }
  const map = {}
  for (const r of rows) map[r.product_id] = { public_id: r.cloudinary_public_id, secure_url: r.secure_url, format: r.format }
  writeFileSync(MEDIA_CACHE, JSON.stringify(map))
  console.log(`[capture] saved ${Object.keys(map).length} media rows -> ${MEDIA_CACHE}`)
}

// ---------------------------------------------------------------------------
// Mode: import (delete + insert)
// ---------------------------------------------------------------------------
async function importAll() {
  console.log(`[import] target=${TARGET} cloud=${CLOUD_NAME}`)
  const { cats, chosen } = buildCategoryMap()
  const products = JSON.parse(readFileSync(PRODUCTS_JSON, 'utf8'))

  let mediaCache = {}
  if (existsSync(MEDIA_CACHE)) {
    try { mediaCache = JSON.parse(readFileSync(MEDIA_CACHE, 'utf8')) } catch { mediaCache = {} }
  }

  // 1) Clear existing data
  console.log('[import] clearing existing data')
  let allSql = `DELETE FROM product_media; DELETE FROM products; DELETE FROM categories;\n`

  // 2) Insert categories (all 476, each gets a unique sequential id kzcat-<n>)
  console.log(`[import] building ${cats.length} categories`)
  cats.forEach((c, n) => {
    const cid = `kzcat-${n}`
    const nameAr = c.name_ar || `category-${n}`
    allSql += `INSERT OR IGNORE INTO categories (id, name_ar, name_en, parent_id, sort_order, is_visible, created_at, updated_at) VALUES (${sqlStr(cid)}, ${sqlStr(nameAr)}, NULL, NULL, ${c.level || 0}, 1, ${sqlStr(now())}, ${sqlStr(now())});\n`
  })

  // 3) Insert products + media
  console.log(`[import] building ${products.length} products + media`)
  let mediaRows = 0
  let unmatchedCat = 0
  for (const p of products) {
    const pid = `kz-${p.id}`
    const catEntry = chosen.get(p.category_ar)
    const catId = catEntry ? `kzcat-${catEntry.n}` : null
    if (!catId) unmatchedCat++
    const nameAr = p.name_ar || p.name_en || 'منتج'
    const nameEn = p.name_en || ''
    const price = parsePrice(p.price)
    const unit = normalizeUnit(p.unit)

    const cols = `id, name_ar, name_en, category_id, price, offer_price, wholesale_price, unit, stock, is_visible, status, is_featured, is_new_arrival, is_best_seller, created_at, updated_at`
    const vals = `${sqlStr(pid)}, ${sqlStr(nameAr)}, ${sqlStr(nameEn)}, ${sqlStr(catId)}, ${price}, 0, 0, ${sqlStr(unit)}, 100, 1, 'active', 0, 0, 0, ${sqlStr(now())}, ${sqlStr(now())}`
    allSql += `INSERT OR IGNORE INTO products (${cols}) VALUES (${vals});\n`

    const img = imageExists(p.id)
    if (img) {
      const mid = `kzm-${pid}`
      const publicId = `products/product-${p.id}`
      let secureUrl
      let format = 'jpg'
      const cached = mediaCache[pid]
      if (cached && cached.secure_url) {
        secureUrl = cached.secure_url
        format = cached.format || 'jpg'
      } else {
        secureUrl = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${publicId}.jpg`
      }
      allSql += `INSERT OR IGNORE INTO product_media (id, product_id, cloudinary_public_id, secure_url, width, height, format, resource_type, is_primary, display_order, created_at, updated_at) VALUES (${sqlStr(mid)}, ${sqlStr(pid)}, ${sqlStr(publicId)}, ${sqlStr(secureUrl)}, 0, 0, ${sqlStr(format)}, 'image', 1, 0, ${sqlStr(now())}, ${sqlStr(now())});\n`
      mediaRows++
    }
  }

  console.log(`[import] executing ${allSql.split(';\n').length} statements`)
  await d1ExecFile(allSql)

  console.log(`[import] DONE products=${products.length} media=${mediaRows} unmatchedCategory=${unmatchedCat}`)
}

// ---------------------------------------------------------------------------
if (MODE === 'capture') {
  captureMedia().catch((e) => { console.error('FATAL', e); process.exit(1) })
} else if (MODE === 'import') {
  importAll().catch((e) => { console.error('FATAL', e); process.exit(1) })
} else {
  console.error('Usage: node scripts/import-export-for-agent.mjs <capture|import> <local|prod>')
  process.exit(1)
}
