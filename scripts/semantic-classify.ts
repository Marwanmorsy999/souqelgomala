/**
 * Semantic product categorization — CLI.
 *
 * Runs the semantic classifier over products INDEPENDENTLY (one analysis per
 * product — never in bulk keyword buckets) and reports the result. Three modes:
 *
 *   tsx scripts/semantic-classify.ts demo
 *       Classify a curated set of tricky products and print the reasoning.
 *       No network / no DB needed. Proves intent-based disambiguation.
 *
 *   tsx scripts/semantic-classify.ts audit [--source=json:<path> | --source=local]
 *       Load every product, run a full independent audit, print the summary and
 *       write scripts/.audit/categorization-report.json (per-product rows).
 *
 *   tsx scripts/semantic-classify.ts apply [--source=local | --remote] [--dry]
 *       Reassign category_id for every product whose proposed category differs
 *       from its current one. `--dry` (default) only prints; drop `--dry` to
 *       write. Local targets the local D1 SQLite; `--remote` targets prod.
 *
 * The classifier itself lives in src/lib/categorization and is the single
 * source of truth shared by the storefront, admin and this script.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import {
  auditProducts,
  summarizeAudit,
  formatAuditReport,
  classify,
  type AuditRow,
} from '../src/lib/categorization/index'

const ROOT = resolve(import.meta.dirname, '..')
const MODE = process.argv[2] || 'demo'
const flags = new Set(process.argv.slice(3))
const sourceArg =
  process.argv.find((a) => a.startsWith('--source='))?.split('=')[1] ?? 'local'
const isRemote = flags.has('--remote')
const isDry = flags.has('--dry') || MODE !== 'apply'

interface RawProduct {
  id: string
  name_en?: string | null
  name_ar?: string | null
  brand?: string | null
  category_id?: string | null
}

async function loadProducts(): Promise<RawProduct[]> {
  if (sourceArg.startsWith('json:')) {
    const p = sourceArg.slice('json:'.length)
    const arr = JSON.parse(readFileSync(resolve(ROOT, p), 'utf8'))
    return Array.isArray(arr) ? arr : []
  }
  // Local D1 read (matches scripts/seed-scraped-products.mjs conventions).
  const sql =
    "SELECT id, name_en, name_ar, brand, category_id FROM products WHERE deleted_at IS NULL;"
  const out = execFileSync(
    join(ROOT, 'node_modules', '.bin', 'wrangler.cmd'),
    ['d1', 'execute', 'DB', '--local', '--command', `"${sql}"`],
    { cwd: ROOT, encoding: 'utf8', shell: true, maxBuffer: 64 * 1024 * 1024 }
  )
  // wrangler prints a banner to stdout before the JSON results; extract the
  // JSON array robustly (first '[' … last ']') so banner text can't break parse.
  const text = String(out)
  const start = text.indexOf('[')
  const end = text.lastIndexOf(']')
  const parsed = JSON.parse(text.slice(start, end + 1))
  const results = parsed[0]?.results ?? []
  return results.map((r: Record<string, string | null>) => ({
    id: String(r.id),
    name_en: r.name_en ?? null,
    name_ar: r.name_ar ?? null,
    brand: r.brand ?? null,
    category_id: r.category_id ?? null,
  }))
}

async function writeReassignments(rows: AuditRow[]): Promise<number> {
  const moved = rows.filter((r) => r.changed)
  if (moved.length === 0) return 0
  const cases = moved.map((r) => `WHEN '${r.id}' THEN '${r.proposedCategoryId}'`).join(' ')
  const ids = moved.map((r) => `'${r.id}'`).join(',')
  const sql = `UPDATE products SET category_id = CASE id ${cases} END WHERE id IN (${ids});`
  if (isDry) {
    console.log(`[apply] DRY RUN — would reassign ${moved.length} products.`)
    return moved.length
  }
  if (isRemote) {
    const { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_DATABASE_ID, CLOUDFLARE_D1_TOKEN } = process.env
    if (!CLOUDFLARE_D1_TOKEN) throw new Error('CLOUDFLARE_D1_TOKEN required for --remote')
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${CLOUDFLARE_DATABASE_ID}/query`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${CLOUDFLARE_D1_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql }),
      }
    )
    const json = await res.json()
    if (!json.success) throw new Error(JSON.stringify(json.errors))
  } else {
    const tmp = join(ROOT, 'scripts', '.audit', 'reassign.sql')
    mkdirSync(join(ROOT, 'scripts', '.audit'), { recursive: true })
    writeFileSync(tmp, sql)
    execFileSync(join(ROOT, 'node_modules', '.bin', 'wrangler.cmd'), [
      'd1',
      'execute',
      'DB',
      '--local',
      '--file',
      `"${tmp}"`,
    ], { cwd: ROOT, encoding: 'utf8', shell: true })
  }
  console.log(`[apply] reassigned ${moved.length} products.`)
  return moved.length
}

const DEMO: RawProduct[] = [
  { id: 'demo-1', name_en: 'Water Color Pencils 12 Colors' },
  { id: 'demo-2', name_en: 'Butter Cookies 200g' },
  { id: 'demo-3', name_en: 'Oasis Soft Drink Orange 1.5L', brand: 'Oasis' },
  { id: 'demo-4', name_en: 'Safa Natural Water 1.5L', brand: 'Safa' },
  { id: 'demo-5', name_en: 'Panda Processed Cheese 200g' },
  { id: 'demo-6', name_en: 'El Arish Black Pepper Powder 50g' },
  { id: 'demo-7', name_en: 'Moulinex Blender 400W' },
  { id: 'demo-8', name_en: 'Sodastream Sparkling Water 1L' },
  { id: 'demo-9', name_en: 'Heinz Tomato Ketchup 340g' },
  { id: 'demo-10', name_en: 'Remove Stains Bleach Liquid 1L' },
]

async function main() {
  if (MODE === 'demo') {
    console.log('SEMANTIC CLASSIFICATION — demo (independent per-product analysis)\n')
    for (const p of DEMO) {
      const r = classify({ id: p.id, nameEn: p.name_en, nameAr: p.name_ar, brand: p.brand })
      const sig = r.reasoning.map((x) => `${x.feature}(+${x.contribution.toFixed(1)})`).join(', ')
      console.log(
        `  ${String(p.name_en).padEnd(38)} -> ${r.nameAr}  (conf ${(r.confidence * 100).toFixed(0)}%)${r.ambiguous ? '  [ambiguous]' : ''}`
      )
      console.log(`      because: ${sig || '(no positive signal — catch-all)'}`)
    }
    return
  }

  if (MODE === 'audit' || MODE === 'apply') {
    let products: RawProduct[]
    try {
      products = await loadProducts()
    } catch (e) {
      console.error(`Could not load products from source "${sourceArg}":`, (e as Error).message)
      console.error('Tip: pass --source=json:<path> with an array of {id,name_en,name_ar,brand,category_id}.')
      process.exit(1)
    }
    console.log(`[audit] loaded ${products.length} products — classifying each independently…`)
    const rows = auditProducts(
      products.map((p) => ({
        id: p.id,
        nameEn: p.name_en,
        nameAr: p.name_ar,
        brand: p.brand,
        currentCategoryId: p.category_id,
      }))
    )
    const summary = summarizeAudit(rows)
    console.log('\n' + formatAuditReport(summary))

    mkdirSync(join(ROOT, 'scripts', '.audit'), { recursive: true })
    writeFileSync(
      join(ROOT, 'scripts', '.audit', 'categorization-report.json'),
      JSON.stringify({ summary, rows }, null, 2)
    )
    console.log(`\n[audit] wrote scripts/.audit/categorization-report.json (${rows.length} rows)`)

    if (MODE === 'apply') {
      const n = await writeReassignments(rows)
      console.log(`[apply] done (dry=${isDry}, remote=${isRemote}) — ${n} reassigned.`)
    }
    return
  }

  console.error(`Unknown mode: ${MODE}. Use demo | audit | apply.`)
  process.exit(1)
}

main().catch((e) => {
  console.error('FATAL', e)
  process.exit(1)
})
