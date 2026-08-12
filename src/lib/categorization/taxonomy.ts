/**
 * Unified Catalog Taxonomy — the single source of truth for the entire store.
 *
 * This module is the canonical definition of the category hierarchy. It is the
 * one place that synchronizes THREE views of the catalog that must never drift
 * apart:
 *
 *   1. The D1 `categories` table        (seeded via the migration generated from
 *                                         `TAXONOMY` — ids match exactly).
 *   2. Site-wide navigation / homepage   (`HOMEPAGE_DISPLAY` is derived from the
 *                                         same nodes, keyed by the same ids).
 *   3. Product classifications           (every product's `category_id` points at
 *                                         one of these ids; the semantic
 *                                         `classifier` scores products against the
 *                                         `concept` vectors below).
 *
 * Each node carries a `concept` vector: a weighted projection of the category's
 * *semantic intent* into a shared functional feature space (see `FEATURES`).
 * The classifier compares a product's extracted feature vector against every
 * category's concept vector — this is meaning/intent analysis, NOT keyword
 * string matching. Conflicting keywords (e.g. "water" in *water-color pencils*,
 * "butter" in *butter cookies*) are resolved by the weighted geometry, not by
 * first-match precedence.
 */

/** Functional / semantic feature dimensions shared across every category. */
export const FEATURES = [
  'edible', // food / drink consumable
  'beverage', // drinkable liquid
  'water', // drinking water specifically (subset of beverage)
  'dairy', // milk-derived
  'refrigerated', // cold-chain product
  'cookingBase', // staple used to cook (rice, pasta, oil, flour, sugar, salt)
  'condiment', // seasoning / sauce / spice
  'spice', // dried seasoning (pepper, cumin, …)
  'sauce', // liquid condiment (ketchup, mayo, …)
  'sweet', // sugar / confection
  'baking', // flour-based / biscuits / pastries
  'snack', // ready-to-eat
  'frozen', // frozen food
  'pantry', // shelf-stable grocery
  'cleaning', // household cleaning agent
  'personalCare', // hygiene / cosmetic
  'baby', // infant-specific
  'stationery', // school / office supplies
  'appliance', // device / hardware
] as const

export type FeatureKey = (typeof FEATURES)[number]

/** A concept vector: feature -> weight in roughly [-2, 2]. */
export type ConceptVector = Partial<Record<FeatureKey, number>>

export interface TaxonomyNode {
  /** Stable id — MUST match the D1 `categories.id` column exactly. */
  id: string
  nameAr: string
  nameEn: string
  /** Parent id (null for top-level departments). */
  parentId: string | null
  /** Display order within its sibling group. */
  sortOrder: number
  /**
   * Semantic intent of the department, expressed as a weighted projection into
   * the shared functional feature space. Positive weights attract products that
   * exhibit the feature; negative weights repel them.
   */
  concept: ConceptVector
  /** Human-readable intent tags (used for reasoning / explainability). */
  intent: string[]
  /** Homepage tile image (public asset). Falls back to a generated tile. */
  image?: string
  /** When false the node is hidden from the public storefront. */
  visible: boolean
}

// ---------------------------------------------------------------------------
// Canonical taxonomy. IDs deliberately mirror the existing D1 seed so the
// migration is non-destructive; the six NEW leaf departments get fresh ids.
// ---------------------------------------------------------------------------
export const TAXONOMY: TaxonomyNode[] = [
  // ---- Top-level departments --------------------------------------------
  {
    id: '10000000-0000-0000-0000-000000000001',
    nameAr: 'بقالة',
    nameEn: 'Grocery',
    parentId: null,
    sortOrder: 1,
    concept: { pantry: 1, edible: 0.6 },
    intent: ['shelf-stable grocery', 'general pantry'],
    image: '/بقاله.webp',
    visible: true,
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    nameAr: 'ألبان',
    nameEn: 'Dairy',
    parentId: null,
    sortOrder: 2,
    concept: { edible: 1, dairy: 2, refrigerated: 1.5, beverage: -0.5 },
    intent: ['milk-derived', 'refrigerated', 'fresh dairy'],
    image: '/منتجات الالبان.webp',
    visible: true,
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    nameAr: 'مشروبات',
    nameEn: 'Beverages',
    parentId: null,
    sortOrder: 3,
    concept: { edible: 0.8, beverage: 2, dairy: -1 },
    intent: ['drinkable', 'liquid refreshment'],
    image: '/مياه والمشروبات الغازيه.webp',
    visible: true,
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    nameAr: 'مجمدات',
    nameEn: 'Frozen',
    parentId: null,
    sortOrder: 4,
    concept: { edible: 1, frozen: 2 },
    intent: ['frozen', 'cold-chain food'],
    image: '/مجمدات.webp',
    visible: true,
  },
  {
    id: '10000000-0000-0000-0000-000000000005',
    nameAr: 'تنظيف',
    nameEn: 'Cleaning',
    parentId: null,
    sortOrder: 5,
    concept: { cleaning: 2, edible: -2, personalCare: 0.3 },
    intent: ['household cleaning', 'non-food'],
    image: '/البلاستيكات والمنظفات.webp',
    visible: true,
  },
  {
    id: '10000000-0000-0000-0000-000000000006',
    nameAr: 'عناية شخصية',
    nameEn: 'Personal Care',
    parentId: null,
    sortOrder: 6,
    concept: { personalCare: 2, edible: -1.5, baby: 0.4 },
    intent: ['hygiene', 'cosmetic', 'body care'],
    image: '/عنايه شخصيه.webp',
    visible: true,
  },
  {
    id: '10000000-0000-0000-0000-000000000007',
    nameAr: 'أطفال',
    nameEn: 'Baby',
    parentId: null,
    sortOrder: 7,
    concept: { baby: 2, personalCare: 0.6, edible: 0.2 },
    intent: ['infant', 'baby care'],
    image: '/العنايه بالطفل.webp',
    visible: true,
  },
  {
    id: '10000000-0000-0000-0000-000000000070',
    nameAr: 'قرطاسية',
    nameEn: 'Stationery',
    parentId: null,
    sortOrder: 8,
    concept: { stationery: 2, edible: -2, appliance: -0.5 },
    intent: ['school', 'office supplies', 'non-food'],
    image: '/قرطاسية.webp',
    visible: true,
  },
  {
    id: '10000000-0000-0000-0000-000000000071',
    nameAr: 'أجهزة صغيرة',
    nameEn: 'Small Appliances',
    parentId: null,
    sortOrder: 9,
    concept: { appliance: 2, edible: -2 },
    intent: ['device', 'hardware', 'non-food'],
    image: '/اجهزه.webp',
    visible: true,
  },

  // ---- Grocery leaves ---------------------------------------------------
  {
    id: '10000000-0000-0000-0000-000000000010',
    nameAr: 'أرز ومكرونة',
    nameEn: 'Rice & Pasta',
    parentId: '10000000-0000-0000-0000-000000000001',
    sortOrder: 1,
    concept: { edible: 1, cookingBase: 2, baking: 1 },
    intent: ['staple', 'cooking base', 'grain / pasta'],
    image: '/الارز والمكرونات.webp',
    visible: true,
  },
  {
    id: '10000000-0000-0000-0000-000000000011',
    nameAr: 'زيوت وسمن',
    nameEn: 'Oils & Ghee',
    parentId: '10000000-0000-0000-0000-000000000001',
    sortOrder: 2,
    concept: { edible: 1, cookingBase: 2 },
    intent: ['cooking oil', 'ghee', 'cooking base'],
    image: '/الزيوت.webp',
    visible: true,
  },
  {
    id: '10000000-0000-0000-0000-000000000012',
    nameAr: 'سكر وملح',
    nameEn: 'Sugar & Salt',
    parentId: '10000000-0000-0000-0000-000000000001',
    sortOrder: 3,
    concept: { edible: 1, cookingBase: 2, sweet: 0.6 },
    intent: ['sweetener', 'seasoning base', 'cooking base'],
    image: '/السكر والشاى والقهوه.webp',
    visible: true,
  },
  {
    id: '10000000-0000-0000-0000-000000000060',
    nameAr: 'بهارات',
    nameEn: 'Spices',
    parentId: '10000000-0000-0000-0000-000000000001',
    sortOrder: 4,
    concept: { edible: 0.8, condiment: 2, spice: 2, cookingBase: 0.8 },
    intent: ['seasoning', 'spice', 'flavor'],
    image: '/بهارات.webp',
    visible: true,
  },
  {
    id: '10000000-0000-0000-0000-000000000061',
    nameAr: 'صلصات',
    nameEn: 'Sauces',
    parentId: '10000000-0000-0000-0000-000000000001',
    sortOrder: 5,
    concept: { edible: 1, condiment: 2, sauce: 2 },
    intent: ['sauce', 'dressing', 'condiment'],
    image: '/الصلصات والصوصات.webp',
    visible: true,
  },
  {
    id: '10000000-0000-0000-0000-000000000062',
    nameAr: 'معلبات',
    nameEn: 'Canned & Preserved',
    parentId: '10000000-0000-0000-0000-000000000001',
    sortOrder: 6,
    concept: { edible: 1, pantry: 1 },
    intent: ['canned', 'preserved', 'shelf-stable food'],
    image: '/المعلبات.webp',
    visible: true,
  },
  {
    id: '10000000-0000-0000-0000-000000000063',
    nameAr: 'مخبوزات وبسكويت',
    nameEn: 'Bakery & Biscuits',
    parentId: '10000000-0000-0000-0000-000000000001',
    sortOrder: 7,
    concept: { edible: 1, baking: 1.5, sweet: 0.7, snack: 1 },
    intent: ['biscuit', 'pastry', 'baked snack'],
    image: '/المخبوزات والبسكوت.webp',
    visible: true,
  },

  // ---- Dairy leaves -----------------------------------------------------
  {
    id: '10000000-0000-0000-0000-000000000020',
    nameAr: 'أجبان',
    nameEn: 'Cheese',
    parentId: '10000000-0000-0000-0000-000000000002',
    sortOrder: 1,
    concept: { edible: 1.5, dairy: 2, refrigerated: 1 },
    intent: ['cheese', 'fermented dairy'],
    image: '/اجبان.webp',
    visible: true,
  },
  {
    id: '10000000-0000-0000-0000-000000000021',
    nameAr: 'زبدة وسمنة',
    nameEn: 'Butter & Ghee',
    parentId: '10000000-0000-0000-0000-000000000002',
    sortOrder: 2,
    concept: { edible: 1.2, dairy: 1.6, refrigerated: 0.8 },
    intent: ['butter', 'ghee spread', 'dairy fat'],
    image: '/زبده.webp',
    visible: true,
  },

  // ---- Beverage leaves --------------------------------------------------
  {
    id: '10000000-0000-0000-0000-000000000030',
    nameAr: 'شاي وقهوة',
    nameEn: 'Tea & Coffee',
    parentId: '10000000-0000-0000-0000-000000000003',
    sortOrder: 1,
    concept: { edible: 0.9, beverage: 1, cookingBase: 0.5 },
    intent: ['hot drink', 'brew', 'stimulant'],
    image: '/السكر والشاى والقهوه.webp',
    visible: true,
  },
  {
    id: '10000000-0000-0000-0000-000000000031',
    nameAr: 'عصائر',
    nameEn: 'Juices',
    parentId: '10000000-0000-0000-0000-000000000003',
    sortOrder: 2,
    concept: { edible: 0.9, beverage: 2 },
    intent: ['juice', 'nectar', 'fruit drink'],
    image: '/عصائر.webp',
    visible: true,
  },
  {
    id: '10000000-0000-0000-0000-000000000032',
    nameAr: 'مياه',
    nameEn: 'Water',
    parentId: '10000000-0000-0000-0000-000000000003',
    sortOrder: 3,
    concept: { beverage: 2, water: 2, edible: 0.3 },
    intent: ['drinking water', 'still / sparkling'],
    image: '/مياه والمشروبات الغازيه.webp',
    visible: true,
  },
]

// ---------------------------------------------------------------------------
// Lookups / helpers
// ---------------------------------------------------------------------------
const BY_ID = new Map(TAXONOMY.map((n) => [n.id, n]))

export function findCategory(id: string | null | undefined): TaxonomyNode | undefined {
  if (!id) return undefined
  return BY_ID.get(id)
}

/** Resolve a category from an id OR an Arabic/English name (case-insensitive). */
export function resolveCategory(ref: string | null | undefined): TaxonomyNode | undefined {
  if (!ref) return undefined
  const byId = BY_ID.get(ref)
  if (byId) return byId
  const norm = ref.trim().toLowerCase()
  return TAXONOMY.find(
    (n) => n.nameAr.trim() === ref.trim() || n.nameEn.trim().toLowerCase() === norm
  )
}

export interface TaxonomyTreeNode extends TaxonomyNode {
  children: TaxonomyTreeNode[]
}

/** Build the parent → children tree (roots first, children sorted by sortOrder). */
export function getTaxonomyTree(): TaxonomyTreeNode[] {
  const nodes = new Map<string, TaxonomyTreeNode>()
  for (const n of TAXONOMY) nodes.set(n.id, { ...n, children: [] })
  const roots: TaxonomyTreeNode[] = []
  for (const n of TAXONOMY) {
    const node = nodes.get(n.id)!
    if (n.parentId && nodes.has(n.parentId)) {
      nodes.get(n.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }
  const sortRec = (list: TaxonomyTreeNode[]) => {
    list.sort((a, b) => a.sortOrder - b.sortOrder)
    list.forEach((c) => sortRec(c.children))
  }
  sortRec(roots)
  return roots
}

/**
 * Ordered list of category ids shown on the homepage. Derived from the SAME
 * taxonomy so the homepage can never drift from the DB / products. Every id
 * here must exist in `TAXONOMY` (enforced by `getHomepageTiles`).
 */
export const HOMEPAGE_DISPLAY: string[] = [
  '10000000-0000-0000-0000-000000000003', // مشروبات
  '10000000-0000-0000-0000-000000000012', // سكر وملح
  '10000000-0000-0000-0000-000000000010', // أرز ومكرونة
  '10000000-0000-0000-0000-000000000011', // زيوت وسمن
  '10000000-0000-0000-0000-000000000002', // ألبان
  '10000000-0000-0000-0000-000000000060', // بهارات
  '10000000-0000-0000-0000-000000000061', // صلصات
  '10000000-0000-0000-0000-000000000062', // معلبات
  '10000000-0000-0000-0000-000000000063', // مخبوزات وبسكويت
  '10000000-0000-0000-0000-000000000032', // مياه
  '10000000-0000-0000-0000-000000000005', // تنظيف
  '10000000-0000-0000-0000-000000000007', // أطفال
  '10000000-0000-0000-0000-000000000006', // عناية شخصية
  '10000000-0000-0000-0000-000000000001', // بقالة
  '10000000-0000-0000-0000-000000000070', // قرطاسية
  '10000000-0000-0000-0000-000000000071', // أجهزة صغيرة
]

export interface HomepageTile {
  id: string
  nameAr: string
  nameEn: string
  image: string
  parentId: string | null
}

/**
 * Resolve the homepage display list into tiles. Throws if a referenced id is
 * missing from the taxonomy, guaranteeing the homepage, nav and DB stay in
 * lock-step (requirement: perfectly synchronized taxonomy).
 */
export function getHomepageTiles(): HomepageTile[] {
  return HOMEPAGE_DISPLAY.map((id) => {
    const node = BY_ID.get(id)
    if (!node) {
      throw new Error(`HOMEPAGE_DISPLAY references unknown taxonomy id: ${id}`)
    }
    return {
      id: node.id,
      nameAr: node.nameAr,
      nameEn: node.nameEn,
      image: node.image ?? `/${node.nameAr}.webp`,
      parentId: node.parentId,
    }
  })
}
