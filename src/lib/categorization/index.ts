/**
 * Public API for the semantic product categorization system.
 *
 * Import from `@/lib/categorization` everywhere — the taxonomy, feature
 * extraction, classifier and audit all live behind this single entry point so
 * the storefront, admin and scripts share one synchronized implementation.
 */

export {
  TAXONOMY,
  FEATURES,
  HOMEPAGE_DISPLAY,
  findCategory,
  resolveCategory,
  getTaxonomyTree,
  getHomepageTiles,
  type TaxonomyNode,
  type TaxonomyTreeNode,
  type FeatureKey,
  type ConceptVector,
  type HomepageTile,
} from './taxonomy'

export { extractFeatures, type ProductInput, type FeatureSignal } from './features'

export {
  classify,
  auditProducts,
  type ClassificationResult,
  type CategoryScore,
  type ClassificationReasoning,
  type AuditRow,
} from './classifier'

export { summarizeAudit, formatAuditReport, type AuditSummary } from './audit'
