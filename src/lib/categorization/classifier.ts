/**
 * Semantic product classifier.
 *
 * For a product it:
 *   1. extracts the functional feature signal (features.ts),
 *   2. scores that signal against EVERY category's `concept` vector via a dot
 *      product (meaning/intent similarity, not keyword precedence),
 *   3. converts raw scores into a probability distribution (softmax) so the
 *      winning category carries a calibrated confidence in [0, 1],
 *   4. records the top contributing features as human-readable reasoning and
 *      the runner-up for transparent disambiguation.
 *
 * Because scoring is geometric over a shared feature space, a product whose
 * name contains a misleading token (e.g. "water" in *water-color pencils*) is
 * pulled toward the correct department by the stronger, phrase-levelled signals
 * — there is no "first matching keyword wins" rule to get wrong.
 */

import {
  TAXONOMY,
  findCategory,
  type TaxonomyNode,
  type FeatureKey,
  type ConceptVector,
} from './taxonomy'
import { extractFeatures, type ProductInput, type FeatureSignal } from './features'

export interface CategoryScore {
  id: string
  nameAr: string
  nameEn: string
  raw: number
  probability: number
}

export interface ClassificationReasoning {
  feature: FeatureKey
  conceptWeight: number
  signalStrength: number
  contribution: number
}

export interface ClassificationResult {
  /** Winning category id (always a real taxonomy node). */
  categoryId: string
  nameAr: string
  nameEn: string
  /** Calibrated confidence of the winning category in [0, 1]. */
  confidence: number
  /** Full ranked score list (descending). */
  scores: CategoryScore[]
  /** Runner-up probability — a small gap flags an ambiguous product. */
  runnerUpProbability: number
  /** Top features that justified the assignment. */
  reasoning: ClassificationReasoning[]
  /** True when no category scored positively (forced catch-all). */
  forced: boolean
  /** True when the winning margin is thin — flagged for human review. */
  ambiguous: boolean
}

const SOFTMAX_TEMP = 1.5

function softmax(scores: number[]): number[] {
  const max = Math.max(...scores)
  const exps = scores.map((s) => Math.exp((s - max) / SOFTMAX_TEMP))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map((e) => e / sum)
}

function dotProduct(concept: ConceptVector, signal: FeatureSignal): number {
  let score = 0
  for (const f of Object.keys(concept) as FeatureKey[]) {
    const w = concept[f]
    const s = signal[f]
    if (w != null && s != null) score += w * s
  }
  return score
}

export function classify(input: ProductInput): ClassificationResult {
  const signal = extractFeatures(input)
  const raw = TAXONOMY.map((node) => dotProduct(node.concept, signal))
  const probs = softmax(raw)

  const ranked: CategoryScore[] = TAXONOMY.map((node, i) => ({
    id: node.id,
    nameAr: node.nameAr,
    nameEn: node.nameEn,
    raw: raw[i],
    probability: probs[i],
  })).sort((a, b) => b.probability - a.probability)

  const best = ranked[0]
  const runnerUp = ranked[1]

  // Forced catch-all: nothing scored positively → assign the generic grocery
  // department so every product stays inside the taxonomy tree.
  const forced = best.raw <= 0
  const winner: TaxonomyNode = forced
    ? (findCategory('10000000-0000-0000-0000-000000000001') as TaxonomyNode)
    : (findCategory(best.id) as TaxonomyNode)

  // Reasoning: features that most supported the winner.
  const reasoning: ClassificationReasoning[] = (
    Object.keys(winner.concept) as FeatureKey[]
  )
    .map((f) => {
      const conceptWeight = winner.concept[f] as number
      const signalStrength = signal[f] ?? 0
      return {
        feature: f,
        conceptWeight,
        signalStrength,
        contribution: conceptWeight * signalStrength,
      }
    })
    .filter((r) => r.contribution > 0)
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 5)

  const ambiguous = !forced && runnerUp != null && best.probability - runnerUp.probability < 0.12

  return {
    categoryId: winner.id,
    nameAr: winner.nameAr,
    nameEn: winner.nameEn,
    confidence: forced ? 0 : best.probability,
    scores: ranked,
    runnerUpProbability: runnerUp?.probability ?? 0,
    reasoning,
    forced,
    ambiguous,
  }
}

export interface AuditRow {
  id: string
  nameEn: string | null
  nameAr: string | null
  currentCategoryId: string | null
  currentCategoryName: string | null
  proposedCategoryId: string
  proposedCategoryName: string
  confidence: number
  ambiguous: boolean
  /** True when the proposed category differs from the product's current one. */
  changed: boolean
  reasoning: ClassificationReasoning[]
}

/**
 * Classify a batch of products independently (one analysis per product) and
 * attach the current assignment for comparison. This is the "granular audit":
 * every product is reasoned about on its own, never in bulk keyword buckets.
 */
export function auditProducts(
  products: Array<
    ProductInput & {
      id: string
      currentCategoryId?: string | null
      currentCategoryName?: string | null
    }
  >
): AuditRow[] {
  return products.map((p) => {
    const result = classify(p)
    const current = findCategory(p.currentCategoryId)
    return {
      id: p.id,
      nameEn: p.nameEn ?? null,
      nameAr: p.nameAr ?? null,
      currentCategoryId: p.currentCategoryId ?? null,
      currentCategoryName: current?.nameAr ?? p.currentCategoryName ?? null,
      proposedCategoryId: result.categoryId,
      proposedCategoryName: result.nameAr,
      confidence: result.confidence,
      ambiguous: result.ambiguous,
      changed: (p.currentCategoryId ?? null) !== result.categoryId,
      reasoning: result.reasoning,
    }
  })
}
