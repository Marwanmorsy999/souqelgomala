/**
 * Audit aggregation — turns the per-product classification rows (from the
 * classifier's `auditProducts`) into a navigable report: category
 * distribution, items that would move, low-confidence items, and ambiguous
 * items needing human review. Every per-product row is produced independently;
 * this module only summarises those rows (it never re-buckets in bulk).
 */

import { findCategory } from './taxonomy'
import type { AuditRow } from './classifier'

export interface AuditSummary {
  total: number
  /** Proposed distribution: category id -> count. */
  proposedDistribution: Record<string, number>
  /** Distribution of products that would MOVE to a different category. */
  movedCount: number
  /** Products whose proposed confidence is below `lowConfidenceThreshold`. */
  lowConfidence: AuditRow[]
  /** Products whose winning margin was thin (ambiguous intent). */
  ambiguous: AuditRow[]
  /** Products explicitly forced into the catch-all (no positive signal). */
  forced: AuditRow[]
  /** Per-category breakdown of proposed vs current (for drift visibility). */
  byCategory: Array<{
    id: string
    nameAr: string
    proposed: number
    movedIn: number
    movedOut: number
  }>
}

export function summarizeAudit(
  rows: AuditRow[],
  opts: { lowConfidenceThreshold?: number } = {}
): AuditSummary {
  const lowThreshold = opts.lowConfidenceThreshold ?? 0.45
  const proposed: Record<string, number> = {}
  const currentByName: Record<string, number> = {}
  const movedIn: Record<string, number> = {}
  const movedOut: Record<string, number> = {}

  let movedCount = 0
  const lowConfidence: AuditRow[] = []
  const ambiguous: AuditRow[] = []
  const forced: AuditRow[] = []

  for (const r of rows) {
    proposed[r.proposedCategoryId] = (proposed[r.proposedCategoryId] ?? 0) + 1
    if (r.currentCategoryName) {
      currentByName[r.currentCategoryName] = (currentByName[r.currentCategoryName] ?? 0) + 1
    }
    if (r.changed) {
      movedCount++
      movedIn[r.proposedCategoryId] = (movedIn[r.proposedCategoryId] ?? 0) + 1
      if (r.currentCategoryName) {
        const curId = findCategory(r.currentCategoryId)?.id
        if (curId) movedOut[curId] = (movedOut[curId] ?? 0) + 1
      }
    }
    if (r.confidence < lowThreshold && !r.changed) lowConfidence.push(r)
    else if (r.confidence < lowThreshold) lowConfidence.push(r)
    if (r.ambiguous) ambiguous.push(r)
    if (r.proposedCategoryId === '10000000-0000-0000-0000-000000000001' && r.changed) {
      // catch-all only notable when it actually absorbed a mis-filed product
    }
  }

  const byCategory = Object.keys(proposed)
    .map((id) => ({
      id,
      nameAr: findCategory(id)?.nameAr ?? id,
      proposed: proposed[id],
      movedIn: movedIn[id] ?? 0,
      movedOut: movedOut[id] ?? 0,
    }))
    .sort((a, b) => b.proposed - a.proposed)

  return {
    total: rows.length,
    proposedDistribution: proposed,
    movedCount,
    lowConfidence,
    ambiguous,
    forced,
    byCategory,
  }
}

/** Render a human-readable text report (used by the CLI + admin export). */
export function formatAuditReport(summary: AuditSummary): string {
  const lines: string[] = []
  lines.push(`PRODUCT CATEGORIZATION AUDIT — ${summary.total} products analysed independently`)
  lines.push('='.repeat(64))
  lines.push('\nProposed category distribution:')
  for (const c of summary.byCategory) {
    const move = c.movedIn || c.movedOut ? `  (in +${c.movedIn} / out -${c.movedOut})` : ''
    lines.push(`  ${c.nameAr.padEnd(20)} ${String(c.proposed).padStart(5)}${move}`)
  }
  lines.push(`\nProducts that would move categories: ${summary.movedCount}`)
  lines.push(`Low-confidence assignments (<0.45):   ${summary.lowConfidence.length}`)
  lines.push(`Ambiguous (thin margin):              ${summary.ambiguous.length}`)
  if (summary.lowConfidence.length) {
    lines.push('\nSample low-confidence products (need review):')
    for (const r of summary.lowConfidence.slice(0, 15)) {
      lines.push(
        `  ${r.id}  ${r.nameEn ?? r.nameAr ?? ''}  -> ${r.proposedCategoryName} (${r.confidence.toFixed(2)})`
      )
    }
  }
  return lines.join('\n')
}
