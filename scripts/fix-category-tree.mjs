/**
 * Fix the category tree in prod D1:
 *   - derive parent_id from categories.json `path` / `parent_path`
 *   - hide non-Arabic (English / junk) leaf categories so the storefront
 *     only shows real Arabic sections.
 *
 * Products stay linked to their level-1 category (kzcat-<n> ids are stable
 * because import-export-for-agent.mjs assigned them by array index, matching
 * categories.json order). Only categories are mutated — no product/media loss.
 *
 * Usage:
 *   node scripts/fix-category-tree.mjs dryrun
 *   node scripts/fix-category-tree.mjs run
 */

import { readFileSync as readFileSyncImpl, existsSync } from 'node:fs'
const fs = { readFileSync: readFileSyncImpl, existsSync }
import { join } from 'node:path'
import { homedir } from 'node:os'

const ROOT = 'D:/souk-el-gomla'
const EXPORT_DIR = 'D:/kheirzaman_scraper/export_for_agent'
const CATS = join(EXPORT_DIR, 'categories.json')
const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID || 'd2209cdaa4e0bfe7fc1cb4bc0bb8b84e'
const DB = process.env.CLOUDFLARE_DATABASE_ID || '0dc1da7c-cfc1-425e-868a-c3c740b44935'
const MODE = process.argv[2] || 'dryrun'

const now = () => new Date().toISOString()

function getToken() {
  if (process.env.CLOUDFLARE_D1_TOKEN) return process.env.CLOUDFLARE_D1_TOKEN
  if (process.env.CLOUDFLARE_OAUTH_TOKEN) return process.env.CLOUDFLARE_OAUTH_TOKEN
  // Fall back to the wrangler default config (oauth_token).
  const candidates = [
    join(homedir(), 'AppData', 'Roaming', 'xdg.config', '.wrangler', 'config', 'default.toml'),
    join(homedir(), '.config', '.wrangler', 'config', 'default.toml'),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      const txt = fs.readFileSync(p, 'utf8')
      const m = txt.match(/oauth_token\s*=\s*"([^"]+)"/)
      if (m) return m[1]
    }
  }
  throw new Error('No D1 token found (set CLOUDFLARE_D1_TOKEN or log in via wrangler)')
}

const D1 = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/d1/database/${DB}/query`
const TOKEN = getToken()
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function d1(sql) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(D1, {
        method: 'POST',
        headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(JSON.stringify(json.errors || json))
      return json.result
    } catch (e) {
      if (attempt === 3) throw e
      await sleep(400 * (attempt + 1))
    }
  }
}

const ARABIC = /[\u0600-\u06FF]/

function sqlStr(v) {
  if (v === null || v === undefined) return 'NULL'
  return `'${String(v).replace(/'/g, "''")}'`
}

function main() {
  const cats = JSON.parse(fs.readFileSync(CATS, 'utf8'))
  const byPath = new Map()
  const dupPaths = []
  cats.forEach((c, n) => {
    if (byPath.has(c.path)) dupPaths.push(c.path)
    byPath.set(c.path, { n, ...c })
  })

  const updates = []
  let visible = 0
  let hidden = 0
  const hiddenNames = []
  const unmatchedParent = []
  cats.forEach((c, n) => {
    const cid = `kzcat-${n}`
    let parentId = null
    if (c.parent_path && c.parent_path !== '') {
      const parent = byPath.get(c.parent_path)
      if (parent) parentId = `kzcat-${parent.n}`
      else unmatchedParent.push({ cid, parent_path: c.parent_path })
    }
    const isVisible = ARABIC.test(c.name_ar || '') ? 1 : 0
    if (isVisible) visible++
    else { hidden++; hiddenNames.push(`${c.name_ar} (${c.path})`) }
    updates.push(
      `UPDATE categories SET parent_id = ${sqlStr(parentId)}, is_visible = ${isVisible}, updated_at = ${sqlStr(now())} WHERE id = ${sqlStr(cid)};`
    )
  })

  console.log(`total categories: ${cats.length}`)
  console.log(`duplicate paths: ${dupPaths.length}`, dupPaths.slice(0, 10))
  console.log(`unmatched parent_path: ${unmatchedParent.length}`, unmatchedParent.slice(0, 10))
  console.log(`visible (Arabic): ${visible} | hidden (junk): ${hidden}`)
  console.log('hidden sample:', hiddenNames.slice(0, 30))
  console.log(`SQL statements to run: ${updates.length}`)

  return { updates, hiddenNames }
}

async function run(updates) {
  const CHUNK = 100
  for (let i = 0; i < updates.length; i += CHUNK) {
    const batch = updates.slice(i, i + CHUNK).join('\n')
    await d1(batch)
    console.log(`committed ${Math.min(i + CHUNK, updates.length)}/${updates.length}`)
  }
  console.log('DONE')
}

const { updates, hiddenNames } = main()
if (MODE === 'run') {
  run(updates).catch((e) => { console.error('FATAL', e); process.exit(1) })
} else {
  console.log('\nDRYRUN complete — pass "run" to apply to prod D1.')
}
