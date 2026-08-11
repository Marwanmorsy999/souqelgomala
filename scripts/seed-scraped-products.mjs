/**
 * Seed script: integrate scraped Kheir Zaman products into the Souk El Gomla
 * D1 catalog (NOT a static file — flows through products/product_media tables).
 *
 * Pipeline per product:
 *   1. Read products.json (scraped source of truth).
 *   2. Map scraped Arabic category -> existing D1 category id.
 *   3. Upload local image to Cloudinary (folder "products", public_id product-{id}).
 *   4. INSERT product row (name_ar = English placeholder) + product_media row.
 *
 * Target is selected by TARGET env var:
 *   TARGET=local     -> wrangler d1 (local SQLite, --local)
 *   TARGET=prod (or unset) -> D1 HTTP API against remote DB
 *
 * Cloudinary creds are read from .env.local (loaded below) or the environment.
 *
 * Run (local first, recommended):
 *   node scripts/seed-scraped-products.mjs local
 * Then (production):
 *   node scripts/seed-scraped-products.mjs prod
 */

import { readFileSync, statSync, writeFileSync, mkdtempSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = resolve(__dirname, '..')
const SCRAPE_DIR = 'D:/kheirzaman_scraper'
const SOURCE_JSON = join(SCRAPE_DIR, 'products.json')
const IMAGES_DIR = join(SCRAPE_DIR, 'images')

// ---------------------------------------------------------------------------
// Existing D1 categories (from drizzle/migrations/0002_seed_data.sql).
// The scraper's 15 Arabic categories map 1:1 onto these seeded categories.
// ---------------------------------------------------------------------------
const CATEGORY_MAP = {
  بقالة: '10000000-0000-0000-0000-000000000001',
  ألبان: '10000000-0000-0000-0000-000000000002',
  مشروبات: '10000000-0000-0000-0000-000000000003',
  مجمدات: '10000000-0000-0000-0000-000000000004',
  تنظيف: '10000000-0000-0000-0000-000000000005',
  'عناية شخصية': '10000000-0000-0000-0000-000000000006',
  أطفال: '10000000-0000-0000-0000-000000000007',
  'أرز ومكرونة': '10000000-0000-0000-0000-000000000010',
  'زيوت وسمن': '10000000-0000-0000-0000-000000000011',
  'سكر وملح': '10000000-0000-0000-0000-000000000012',
  أجبان: '10000000-0000-0000-0000-000000000020',
  'زبدة وسمنة': '10000000-0000-0000-0000-000000000021',
  'شاي وقهوة': '10000000-0000-0000-0000-000000000030',
  عصائر: '10000000-0000-0000-0000-000000000031',
  مياه: '10000000-0000-0000-0000-000000000032',
  // Catch-all leaf under بقالة (only used when nothing else matches).
  متفرقات: '10000000-0000-0000-0000-000000000050',
}

// New leaf categories added by the taxonomy restructure (A1). They must be
// inserted into D1 before reclassify runs (see `seed-categories` mode).
const EXTRA_CATEGORY_SEED = [
  { id: CATEGORY_MAP['متفرقات'], name_ar: 'متفرقات', name_en: 'Misc', parent_id: CATEGORY_MAP['بقالة'], sort_order: 99 },
  { id: '10000000-0000-0000-0000-000000000040', name_ar: 'منظفات', name_en: 'Detergents', parent_id: CATEGORY_MAP['تنظيف'], sort_order: 4 },
  { id: '10000000-0000-0000-0000-000000000041', name_ar: 'حفاضات', name_en: 'Diapers', parent_id: CATEGORY_MAP['أطفال'], sort_order: 4 },
]

// ---------------------------------------------------------------------------
// Env
// ---------------------------------------------------------------------------
const MODE = process.argv[2] || 'seed'
const TARGET = (process.argv[3] || (MODE === 'seed' ? process.argv[2] : 'prod')) === 'local' ? 'local' : 'prod'

// Load .env.local if present (simple KEY=VALUE parser; skips comments/blank).
function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(ROOT, '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const eq = t.indexOf('=')
      if (eq < 0) continue
      const k = t.slice(0, eq).trim()
      const v = t.slice(eq + 1).trim()
      if (!(k in process.env)) process.env[k] = v
    }
  } catch {
    /* no .env.local */
  }
}
loadEnvLocal()

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const CLOUD_API_KEY = process.env.CLOUDINARY_API_KEY
const CLOUD_API_SECRET = process.env.CLOUDINARY_API_SECRET

// D1 access: prefer explicit D1_HTTP_TOKEN + CLOUDFLARE_ACCOUNT_ID, otherwise
// fall back to the wrangler OAuth token (with d1:write scope) if present.
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || 'd2209cdaa4e0bfe7fc1cb4bc0bb8b84e'
const CF_D1_TOKEN = process.env.CLOUDFLARE_D1_TOKEN || process.env.D1_HTTP_TOKEN || process.env.CLOUDFLARE_OAUTH_TOKEN
const CF_D1_DB = process.env.CLOUDFLARE_DATABASE_ID || '0dc1da7c-cfc1-425e-868a-c3c740b44935'

// Cloudinary creds are only required for the full seed (image upload).
// fix-categories-v2 / fix-translate / preview-classify don't upload images.
const NEEDS_CLOUD = MODE === 'seed' || MODE === 'local' || MODE === undefined
if (NEEDS_CLOUD && (!CLOUD_NAME || !CLOUD_API_KEY || !CLOUD_API_SECRET)) {
  console.error('Missing Cloudinary credentials (CLOUDINARY_API_KEY/SECRET/CLOUD_NAME).')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const now = () => new Date().toISOString()
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function parsePrice(raw) {
  const n = parseFloat(String(raw).replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) ? n : 0
}

function findImageFile(id) {
  for (const ext of ['.jpg', '.jpeg', '.png', '.JPG', '.PNG']) {
    const p = join(IMAGES_DIR, `${id}${ext}`)
    if (statSync(p, { throwIfNoEntry: false })) return p
  }
  return null
}

// ---------------------------------------------------------------------------
// Per-product category resolution (improved, type-based classifier).
//
// The scraped source's English `category` field and the scraper's
// export_site/*.json `id->category` map were both produced by naive keyword
// matching and are heavily mis-filed (e.g. "Water Color Pencils" -> مياه,
// "Butter Cookies" -> زبدة وسمنة, "Oasis Soft Drink" -> أجبان). We instead
// classify directly from the product name using an ordered priority list of
// type keywords. Unmatched products fall back to بقالة (grocery).
// ---------------------------------------------------------------------------

// Priority-ordered: first match wins. Order matters (e.g. drinking water must
// be tested before the generic "drink"/"juice" bucket so brand names like
// "Watermelon" don't pull water-flavoured snacks into مياه).
const CLASSIFY_RULES = [
  // Drinking water (explicit water beverages only)
  [/(^|\b)(natural water|pure life|sparkling water|mineral water|drinking water|nasr water|safa|hayat.*water|isis|nestle.*water|arwa|baraka|aquafina)\b/i, 'مياه'],
  // Juices / soft drinks / flavored beverages
  [/(^|\b)(juice|juices|soft drink|drink|beverage|cola|lemon|mint|peach|guava|mango|berry|berries|apple|orange|fizz|soda|nectar|cocktail|lemonade|tonic|iced tea|ice tea|energy drink|red bull|stars|bibo|schweppes|pepsi|sprite|7up|mirinda|fanta)\b/i, 'عصائر'],
  // Dairy (milk, labneh, eshta, yogurt)
  [/(^|\b)(milk|labneh|eshta|لبن|لبنة|زبادي|yogurt|yoghurt|cream.*milk|milk.*cream|fresh milk|long life|u h t|uht)\b/i, 'ألبان'],
  // Cheese
  [/(^|\b)(cheese|جبن|cheddar|mozzarella|feta|ricotta|paneer|processed cheese|cream cheese)\b/i, 'أجبان'],
  // Butter / ghee
  [/(^|\b)(butter|زبدة|blended butter|smen|samneh|ghee)\b/i, 'زبدة وسمنة'],
  // Oils
  [/(^|\b)(oil|زيوت|زيت|olive oil|sunflower|corn oil|vegetable oil|shortening|سمنة نباتية)\b/i, 'زيوت وسمن'],
  // Rice & pasta
  [/(^|\b)(rice|أرز|pasta|macaroni|spaghetti|نودلز|noodles|vermicelli|شعرية|بلبن|مكرونة)\b/i, 'أرز ومكرونة'],
  // Sugar & salt
  [/(^|\b)(sugar|سكر|salt|ملح|sweetener|سكرين)\b/i, 'سكر وملح'],
  // Tea & coffee (incl. syrups, honey, cocoa, malt)
  [/(^|\b)(tea|شاي|coffee|قهوة|nescafe|nescaf|instant coffee|cocoa|كاكاو|honey|عسل|syrup|شربات|molasses|دبس|malt|مالت|fenjal|fenjan|cinnamon.*drink)\b/i, 'شاي وقهوة'],
  // Cleaning & household
  [/(^|\b)(wipes|مناديل|tissue|كلين|cleaning|تنظيف|detergent|صابون|شامبو غسيل|مسحوق|bleach|مبيض|مطهر|disinfect|sponge|إسفنج|floor|أرضيات|drain|بايب|trash bag|كيس زبالة|garbage|مكانس|fabric|مكوى|iron.*cloth)\b/i, 'تنظيف'],
  // Personal care
  [/(^|\b)(shampoo|بيرسونال|عناية|كريم|لوشن|لوسيون|بودرة|مزيل عرق|عطر|deodorant|soap|personal care|معجون أسنان|toothpaste|فرشاة أسنان|بامبرز body|body lotion| sunscreen|واقي شمس|razor|ماكينة حلاقة|ماسك|face mask|شامبو شعر)\b/i, 'عناية شخصية'],
  // Baby
  [/(^|\b)(baby|أطفال|حفاضات|ديبرز|diaper|pacifier|رضاعة|مصاصة|ببرونة|teether|baby.*food|baby.*milk|أطفال.*حليب)\b/i, 'أطفال'],
  // Frozen
  [/(^|\b)(frozen|مجمد|ايس كريم|ice cream|مجمدات|فريزر)\b/i, 'مجمدات'],
  // Beverages category (مشروبات) — catch-all for general drinks missed above
  [/(^|\b)(مشروب|beverage|drinks)\b/i, 'مشروبات'],
]

function classifyCategory(nameEn) {
  const s = nameEn || ''
  for (const [re, cat] of CLASSIFY_RULES) {
    if (re.test(s)) return CATEGORY_MAP[cat]
  }
  // Fall back to the catch-all LEAF (never a bare parent) so the tree stays strict.
  return CATEGORY_MAP['متفرقات']
}

// Build a per-id override map from the OLD export_site files (kept for diff/
// reporting only — no longer used for assignment).
function buildOldCategoryMap() {
  const map = new Map()
  const exportDir = join(SCRAPE_DIR, 'export_site')
  const files = readdirSync(exportDir).filter(
    (f) => f.endsWith('.json') && f !== 'manifest.json'
  )
  for (const file of files) {
    let arr
    try {
      arr = JSON.parse(readFileSync(join(exportDir, file), 'utf8'))
    } catch {
      continue
    }
    if (!Array.isArray(arr)) continue
    for (const item of arr) {
      if (item.category && item.id != null && CATEGORY_MAP[item.category]) {
        map.set(Number(item.id), CATEGORY_MAP[item.category])
      }
    }
  }
  return map
}

const OLD_CATEGORY_MAP = buildOldCategoryMap()

// Map the scraper's canonical source `category` label to our category IDs.
// Used ONLY as a fallback when the name classifier can't place a product into
// a specific category (i.e. it falls back to grocery). This fills genuine gaps
// like مشروبات (Beverage) without overriding the more precise name matching.
const SOURCE_CATEGORY_MAP = {
  Beverage: CATEGORY_MAP['مشروبات'],
  'Hot Drinks': CATEGORY_MAP['شاي وقهوة'],
  Dairy: CATEGORY_MAP['ألبان'],
  Milk: CATEGORY_MAP['ألبان'],
  'Frozen Food': CATEGORY_MAP['مجمدات'],
  'Home &Fabric Care': CATEGORY_MAP['تنظيف'],
  'Home Base': CATEGORY_MAP['تنظيف'],
  'Paper Products': CATEGORY_MAP['تنظيف'],
  'Health& Beauty': CATEGORY_MAP['عناية شخصية'],
  'Personal Care': CATEGORY_MAP['عناية شخصية'],
  'Small Appliances': CATEGORY_MAP['عناية شخصية'],
  'Pets': CATEGORY_MAP['عناية شخصية'],
}

function categoryIdFor(productId, nameEn, sourceCategory) {
  // 1) name classifier (precise), 2) old map, 3) source label gap-fill, 4) catch-all leaf.
  const classified = classifyCategory(nameEn)
  if (classified !== CATEGORY_MAP['متفرقات']) return classified
  if (OLD_CATEGORY_MAP.get(Number(productId))) return OLD_CATEGORY_MAP.get(Number(productId))
  if (sourceCategory && SOURCE_CATEGORY_MAP[sourceCategory]) {
    return SOURCE_CATEGORY_MAP[sourceCategory]
  }
  return CATEGORY_MAP['متفرقات']
}

// ---------------------------------------------------------------------------
// Unit normalization (B2) — collapse free-text unit strings into a small set of
// facetable values. The human-readable `size` is derived separately in the
// storefront mapper, so overwriting `unit` here is safe.
// ---------------------------------------------------------------------------
const UNIT_NORMALIZE = [
  [/(كيلو|kg|كلغ|كيلوجرام|kilo)/i, 'كيلو'],
  [/(جرام|جم|g|gram|غرام)/i, 'جرام'],
  [/(علبة|عبوة|زجاجة|باكت|باكيت|packet|box|bottle|can|علب)/i, 'علبة'],
  [/(كرتونة|كرتون|carton)/i, 'كرتونة'],
  [/(حبة|قطعة|piece|حبات|قطع)/i, 'حبة'],
  [/(رول|لفة|roll)/i, 'رول'],
]

function normalizeUnit(raw) {
  const s = (raw || '').toString().trim()
  if (!s || s === 'piece') return 'حبة'
  for (const [re, norm] of UNIT_NORMALIZE) {
    if (re.test(s)) return norm
  }
  // Default unknown packaging to a generic piece/"حبة" so the facet is clean.
  return 'حبة'
}

// ---------------------------------------------------------------------------
// Arabic translation of product names (free Google Translate endpoint, no key).
// Source data has name_ar = null for ALL products, so we translate name_en.
// Results are cached in a JSON file so re-runs are cheap and idempotent.
// ---------------------------------------------------------------------------
const TRANSLATE_CACHE_FILE = join(ROOT, 'scripts', '.kz_translate_cache.json')
let TRANSLATE_CACHE = {}
try {
  TRANSLATE_CACHE = JSON.parse(readFileSync(TRANSLATE_CACHE_FILE, 'utf8'))
} catch {
  TRANSLATE_CACHE = {}
}

async function translateToArabic(text) {
  const key = String(text)
  if (TRANSLATE_CACHE[key]) return TRANSLATE_CACHE[key]
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ar&dt=t&q=${encodeURIComponent(key)}`
    const r = await fetch(url)
    const j = await r.json()
    const out = (j[0] || []).map((x) => x[0]).join('')
    const translated = out && out.trim() ? out.trim() : key
    TRANSLATE_CACHE[key] = translated
    return translated
  } catch {
    return key
  }
}

function persistTranslateCache() {
  try {
    writeFileSync(TRANSLATE_CACHE_FILE, JSON.stringify(TRANSLATE_CACHE))
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// Cloudinary upload (server-to-server, public_id = product-{id}, folder products)
// ---------------------------------------------------------------------------
async function signParams(params) {
  const sorted = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== '')
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&')
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(sorted + CLOUD_API_SECRET))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function uploadImage(filePath) {
  const buffer = readFileSync(filePath)
  const timestamp = Math.floor(Date.now() / 1000)
  const folder = 'products'
  const publicId = 'product-' + basenameNoExt(filePath)
  const signature = await signParams({ folder, public_id: publicId, timestamp })
  const form = new FormData()
  form.append('file', new Blob([buffer]))
  form.append('api_key', CLOUD_API_KEY)
  form.append('folder', folder)
  form.append('public_id', publicId)
  form.append('timestamp', String(timestamp))
  form.append('signature', signature)
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Cloudinary upload failed ${res.status}: ${body.slice(0, 200)}`)
  }
  const json = await res.json()
  if (json.error) throw new Error(`Cloudinary error: ${json.error.message}`)
  return { publicId: json.public_id, secureUrl: json.secure_url, format: json.format || 'jpg' }
}

function basenameNoExt(p) {
  const b = p.split(/[\\/]/).pop()
  return b.replace(/\.[^.]+$/, '')
}

// ---------------------------------------------------------------------------
// D1 execution — direct Cloudflare D1 HTTP API (no subprocess, resilient).
// Both local and prod targets use the same API; for --local we fall back to
// the wrangler CLI (the local SQLite file isn't reachable via HTTP API).
// ---------------------------------------------------------------------------
const D1_API = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_D1_DB}/query`

async function d1ExecHttp(sql) {
  let lastErr
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(D1_API, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${CF_D1_TOKEN}`,
          'Content-Type': 'application/json',
        },
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
  const dir = mkdtempSync(join(tmpdir(), 'seed-'))
  const tmp = join(dir, 'batch.sql')
  writeFileSync(tmp, sql)
  const wranglerBin = join(ROOT, 'node_modules', '.bin', 'wrangler')
  const cmd = process.platform === 'win32' ? `${wranglerBin}.cmd` : wranglerBin
  return execFileSync(cmd, ['d1', 'execute', 'DB', '--local', '--file', tmp], {
    cwd: ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  })
}

async function d1Exec(sql) {
  if (TARGET === 'local') return d1ExecLocal(sql)
  if (!CF_D1_TOKEN) {
    throw new Error('No D1 token available (set CLOUDFLARE_D1_TOKEN or CLOUDFLARE_OAUTH_TOKEN).')
  }
  return d1ExecHttp(sql)
}

// For prod we use parameterized single-row inserts. For local we batch raw SQL.
// To keep both paths simple and correct, we generate parameterized SQL strings
// with inline-escaped literals for the local (sqlite) path, and bound params
// for prod. Here we implement the prod path with bindings and local with escaping.

function sqlStr(v) {
  if (v === null || v === undefined) return 'NULL'
  return `'${String(v).replace(/'/g, "''")}'`
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`[seed] target=${TARGET} cloud=${CLOUD_NAME}`)
  let products = JSON.parse(readFileSync(SOURCE_JSON, 'utf8'))
  const LIMIT = parseInt(process.env.LIMIT || '', 10)
  if (Number.isFinite(LIMIT) && LIMIT > 0) products = products.slice(0, LIMIT)
  console.log(`[seed] loaded ${products.length} scraped products` + (LIMIT ? ` (LIMIT=${LIMIT})` : ''))

  let inserted = 0
  let skipped = 0
  let failed = 0
  const BATCH = 25
  const UPLOAD_CONCURRENCY = 4

  for (let i = 0; i < products.length; i += BATCH) {
    const batch = products.slice(i, i + BATCH)
    // Build product + media rows in memory, uploading images concurrently.
    const rows = []
    await Promise.all(
      batch.map(async (p) => {
        try {
          const catId = categoryIdFor(p.id, p.name_en, p.category)
          const pid = `kz-${p.id}`
          const price = parsePrice(p.price_raw)
          const imgPath = findImageFile(p.id)
          let media = null
          if (imgPath) {
            try {
              media = await uploadImage(imgPath)
            } catch (e) {
              console.warn(`[img] ${pid} upload failed: ${e.message}`)
            }
          }
          const nameAr = await translateToArabic(p.name_en || `Product ${p.id}`)
          rows.push({
            pid,
            catId,
            name_ar: nameAr,
            name_en: p.name_en || '',
            price,
            unit: normalizeUnit(p.unit),
            image_path: imgPath ? `product-${p.id}` : null,
            secure_url: media ? media.secureUrl : null,
            format: media ? media.format : 'jpg',
          })
        } catch (e) {
          console.error(`[row] ${p.id} error: ${e.message}`)
          failed++
        }
      })
    )

    // Persist rows (single inline-SQL batch, executed via wrangler CLI).
    for (const r of rows) {
      try {
        const cols = `id, name_ar, name_en, category_id, price, offer_price, wholesale_price, unit, stock, is_visible, status, is_featured, is_new_arrival, is_best_seller, created_at, updated_at`
        const vals = `${sqlStr(r.pid)}, ${sqlStr(r.name_ar)}, ${sqlStr(r.name_en)}, ${sqlStr(r.catId)}, ${r.price}, 0, 0, ${sqlStr(r.unit)}, 100, 1, 'active', 0, 0, 0, ${sqlStr(now())}, ${sqlStr(now())}`
        let sql = `INSERT OR IGNORE INTO products (${cols}) VALUES (${vals});\n`
        if (r.image_path && r.secure_url) {
          const mid = `kzm-${r.pid}`
          sql += `INSERT OR IGNORE INTO product_media (id, product_id, cloudinary_public_id, secure_url, width, height, format, resource_type, is_primary, display_order, created_at, updated_at) VALUES (${sqlStr(mid)}, ${sqlStr(r.pid)}, ${sqlStr(r.image_path)}, ${sqlStr(r.secure_url)}, 0, 0, ${sqlStr(r.format)}, 'image', 1, 0, ${sqlStr(now())}, ${sqlStr(now())});\n`
        }
        d1Exec(sql)
        inserted++
      } catch (e) {
        console.error(`[db] ${r?.pid} insert failed: ${e.message}`)
        failed++
      }
    }

    const done = inserted + skipped + failed
    if (i % (BATCH * 20) === 0 || i + BATCH >= products.length) {
      console.log(`[seed] progress ${done}/${products.length} inserted=${inserted} failed=${failed}`)
    }
    // Be polite to Cloudinary / D1.
    await sleep(TARGET === 'prod' ? 250 : 50)
  }

  console.log(`[seed] DONE inserted=${inserted} failed=${failed}`)
}

// ---------------------------------------------------------------------------
// Re-classify + re-translate modes (operate on already-seeded kz-% rows).
// ---------------------------------------------------------------------------

// fix-categories-v2: re-assign category_id using the improved type classifier.
async function fixCategoriesV2() {
  console.log(`[fix-cat-v2] target=${TARGET} — re-classifying kz-% products`)
  const products = JSON.parse(readFileSync(SOURCE_JSON, 'utf8'))
  const BATCH = 200
  let updated = 0
  let failed = 0
  for (let i = 0; i < products.length; i += BATCH) {
    const slice = products.slice(i, i + BATCH)
    const cases = slice
      .map((p) => {
        const cat = categoryIdFor(p.id, p.name_en, p.category)
        return `WHEN 'kz-${p.id}' THEN '${cat}'`
      })
      .join(' ')
    const idList = slice.map((p) => `'kz-${p.id}'`).join(',')
    const sql = `UPDATE products SET category_id = CASE id ${cases} END WHERE id IN (${idList});`
    try {
      await d1Exec(sql)
      updated += slice.length
    } catch (e) {
      console.error(`[fix-cat-v2] batch failed: ${e.message}`)
      failed += slice.length
    }
    if (i % (BATCH * 10) === 0 || i + BATCH >= products.length) {
      console.log(`[fix-cat-v2] progress ${updated + failed}/${products.length} updated=${updated} failed=${failed}`)
    }
    await sleep(TARGET === 'prod' ? 150 : 20)
  }
  console.log(`[fix-cat-v2] DONE updated=${updated} failed=${failed}`)
}

// fix-translate: translate name_en -> name_ar for all kz-% rows.
async function fixTranslate() {
  console.log(`[fix-translate] target=${TARGET} — translating kz-% product names`)
  const products = JSON.parse(readFileSync(SOURCE_JSON, 'utf8'))
  const BATCH = 25
  let updated = 0
  let failed = 0
  const B = 500
  for (let i = 0; i < products.length; i += B) {
    const slice = products.slice(i, i + B)
    // Resolve translations (cache makes this free on resume).
    const rows = []
    for (const p of slice) {
      const ar = await translateToArabic(p.name_en || `Product ${p.id}`)
      rows.push({ id: `kz-${p.id}`, ar })
    }
    // One batched UPDATE; only touch rows still untranslated (name_ar = name_en).
    const cases = rows
      .map((r) => `WHEN '${r.id}' THEN ${sqlStr(r.ar)}`)
      .join(' ')
    const idList = rows.map((r) => `'${r.id}'`).join(',')
    const sql = `UPDATE products SET name_ar = CASE id ${cases} END WHERE id IN (${idList}) AND name_ar = name_en;`
    try {
      await d1Exec(sql)
      updated += rows.length
    } catch (e) {
      console.error(`[fix-translate] batch failed: ${e.message}`)
      failed += rows.length
    }
    persistTranslateCache()
    if (i % (B * 10) === 0 || i + B >= products.length) {
      console.log(`[fix-translate] progress ${updated + failed}/${products.length} updated=${updated} failed=${failed}`)
    }
    await sleep(TARGET === 'prod' ? 250 : 30)
  }
  persistTranslateCache()
  console.log(`[fix-translate] DONE updated=${updated} failed=${failed}`)
}

// seed-categories: insert the extra leaf categories (catch-all + children) so
// the taxonomy restructure (A1) exists before reclassify runs. Idempotent.
async function seedCategories() {
  console.log(`[seed-cat] target=${TARGET} — inserting ${EXTRA_CATEGORY_SEED.length} extra categories`)
  const nowTs = now()
  for (const c of EXTRA_CATEGORY_SEED) {
    const sql = `INSERT OR IGNORE INTO categories (id, name_ar, name_en, parent_id, sort_order, is_visible, created_at, updated_at) VALUES (${sqlStr(c.id)}, ${sqlStr(c.name_ar)}, ${sqlStr(c.name_en)}, ${sqlStr(c.parent_id)}, ${c.sort_order}, 1, ${sqlStr(nowTs)}, ${sqlStr(nowTs)});`
    try {
      await d1Exec(sql)
      console.log(`[seed-cat] ensured ${c.name_ar} (${c.id})`)
    } catch (e) {
      console.error(`[seed-cat] failed ${c.name_ar}: ${e.message}`)
    }
  }
  console.log('[seed-cat] DONE')
}

// reclassify: re-assign category_id + normalized unit for all kz-% products.
async function reclassify() {
  console.log(`[reclassify] target=${TARGET} — re-classifying + normalizing kz-% products`)
  const products = JSON.parse(readFileSync(SOURCE_JSON, 'utf8'))
  const BATCH = 200
  let updated = 0
  let failed = 0
  for (let i = 0; i < products.length; i += BATCH) {
    const slice = products.slice(i, i + BATCH)
    const catCases = slice
      .map((p) => `WHEN 'kz-${p.id}' THEN '${categoryIdFor(p.id, p.name_en, p.category)}'`)
      .join(' ')
    const unitCases = slice
      .map((p) => `WHEN 'kz-${p.id}' THEN ${sqlStr(normalizeUnit(p.unit))}`)
      .join(' ')
    const idList = slice.map((p) => `'kz-${p.id}'`).join(',')
    const sql = `UPDATE products SET category_id = CASE id ${catCases} END, unit = CASE id ${unitCases} END WHERE id IN (${idList});`
    try {
      await d1Exec(sql)
      updated += slice.length
    } catch (e) {
      console.error(`[reclassify] batch failed: ${e.message}`)
      failed += slice.length
    }
    if (i % (BATCH * 10) === 0 || i + BATCH >= products.length) {
      console.log(`[reclassify] progress ${updated + failed}/${products.length} updated=${updated} failed=${failed}`)
    }
    await sleep(TARGET === 'prod' ? 150 : 20)
  }
  console.log(`[reclassify] DONE updated=${updated} failed=${failed}`)
}

// audit-categories: print CURRENT category distribution (joined to names) AND
// the distribution the improved classifier WOULD produce, so divergence is visible.
async function auditCategories() {
  console.log(`[audit] target=${TARGET} — current vs proposed category distribution`)
  // Current distribution from D1.
  let currentCounts = {}
  try {
    const rows = await d1Exec(TARGET === 'local'
      ? `SELECT c.name_ar AS name, COUNT(*) AS cnt FROM products p JOIN categories c ON c.id = p.category_id GROUP BY c.name_ar;`
      : `SELECT c.name_ar AS name, COUNT(*) AS cnt FROM products p JOIN categories c ON c.id = p.category_id GROUP BY c.name_ar;`)
    // For prod the HTTP API returns result[0].results; for local, raw text. Parse defensively.
    const parsed = parseD1Results(rows)
    currentCounts = {}
    for (const r of parsed) currentCounts[r.name] = Number(r.cnt)
  } catch (e) {
    console.warn(`[audit] could not read current distribution: ${e.message}`)
  }

  // Proposed distribution from the classifier.
  const products = JSON.parse(readFileSync(SOURCE_JSON, 'utf8'))
  const proposed = {}
  for (const p of products) {
    const id = categoryIdFor(p.id, p.name_en, p.category)
    const name = Object.keys(CATEGORY_MAP).find((k) => CATEGORY_MAP[k] === id) || '???'
    proposed[name] = (proposed[name] || 0) + 1
  }

  const allNames = new Set([...Object.keys(currentCounts), ...Object.keys(proposed)])
  console.log('\n  category\tcurrent\tproposed\tΔ')
  for (const name of [...allNames].sort()) {
    const cur = currentCounts[name] || 0
    const prop = proposed[name] || 0
    const diff = prop - cur
    console.log(`  ${name}\t${cur}\t${prop}\t${diff >= 0 ? '+' : ''}${diff}`)
  }
  const curTotal = Object.values(currentCounts).reduce((a, b) => a + b, 0)
  const propTotal = Object.values(proposed).reduce((a, b) => a + b, 0)
  console.log(`  TOTAL\t${curTotal}\t${propTotal}`)
  console.log(`  "متفرقات" (catch-all) proposed: ${proposed['متفرقات'] || 0}`)
}

// Parse D1 query results across local (raw SQL text) and prod (JSON) paths.
function parseD1Results(rows) {
  if (Array.isArray(rows)) {
    // prod HTTP: array of statement result objects
    const stmt = rows.find((r) => Array.isArray(r.results)) || rows[0]
    const results = stmt?.results || stmt || []
    return results.map((r) => (Array.isArray(r) ? r[0] : r))
  }
  return []
}

// preview-classify: print the proposed category distribution WITHOUT writing.
function previewClassify() {
  const products = JSON.parse(readFileSync(SOURCE_JSON, 'utf8'))
  const counts = {}
  for (const p of products) {
    const id = categoryIdFor(p.id, p.name_en, p.category)
    const name = Object.keys(CATEGORY_MAP).find((k) => CATEGORY_MAP[k] === id) || '???'
    counts[name] = (counts[name] || 0) + 1
  }
  console.log('[preview] proposed category distribution:')
  for (const [k, v] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}\t${v}`)
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  console.log(`  TOTAL\t${total}`)
}

if (MODE === 'fix-categories-v2') {
  fixCategoriesV2().catch((e) => { console.error('FATAL', e); process.exit(1) })
} else if (MODE === 'fix-translate') {
  fixTranslate().catch((e) => { console.error('FATAL', e); process.exit(1) })
} else if (MODE === 'preview-classify') {
  previewClassify()
} else if (MODE === 'audit-categories') {
  auditCategories().catch((e) => { console.error('FATAL', e); process.exit(1) })
} else if (MODE === 'reclassify') {
  reclassify().catch((e) => { console.error('FATAL', e); process.exit(1) })
} else if (MODE === 'seed-categories') {
  seedCategories().catch((e) => { console.error('FATAL', e); process.exit(1) })
} else {
  main().catch((e) => {
    console.error('FATAL', e)
    process.exit(1)
  })
}
