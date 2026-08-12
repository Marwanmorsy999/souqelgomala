/**
 * Semantic feature extraction.
 *
 * Converts a product's raw attributes (name, brand, unit, description) into a
 * signal vector over the SAME functional feature space used by the taxonomy's
 * `concept` vectors (see taxonomy.ts). This is the *understanding* step: we
 * read the product's intent/function from its attributes, then the classifier
 * compares that signal against each category's concept geometry.
 *
 * It is deliberately NOT a category-assignment step — no category names appear
 * here. That separation is what makes the system semantic rather than keyword-
 * matched: the same extracted signal is scored against every category, and
 * conflicting cues (e.g. "water" inside "water-color pencils") are neutralised
 * by phrase-level rules BEFORE scoring.
 */

import type { FeatureKey, ConceptVector } from './taxonomy'

export interface ProductInput {
  id?: string
  nameEn?: string | null
  nameAr?: string | null
  brand?: string | null
  unit?: string | null
  description?: string | null
}

/** A feature signal: feature -> accumulated strength (clamped to [-2, 2]). */
export type FeatureSignal = ConceptVector

const clamp = (n: number, lo = -2, hi = 2) => Math.max(lo, Math.min(hi, n))

// ---------------------------------------------------------------------------
// Phrase-level rules — evaluated FIRST. These neutralise the classic keyword
// traps where a sub-word would otherwise mislead a naive matcher.
// Each rule: regex (tested against the normalized full text) -> feature deltas.
// ---------------------------------------------------------------------------
const PHRASE_RULES: Array<{ re: RegExp; add: Partial<FeatureSignal> }> = [
  // "water color" / "watercolour" / colouring pencils -> STATIONERY, never water.
  {
    re: /\b(water[-\s]?colou?r|colou?r(ing)?\s+pencil|pencil\s+crayon|crayon|colour\s+pencil|marker\s+pen|whiteboard\s+marker)\b/i,
    add: { stationery: 2, beverage: -2, edible: -2 },
  },
  // Generic stationery / school / office supplies.
  {
    re: /\b(pencil|pen\s|pens\b|eraser|ruler|notebook|copybook|exercise\s+book|كراسة|دفتر|قلم|قرطاسية|ممحاة|مسطرة|ورق|ملزمة)\b/i,
    add: { stationery: 2, edible: -2, beverage: -1 },
  },
  // Small appliances / devices.
  {
    re: /\b(blender|mixer|toaster|iron\s|heater|fan\s|khallat|خلاط|مكوة|مروحة|جهاز|فرن|سخان)\b/i,
    add: { appliance: 2, edible: -2, cleaning: -1 },
  },
  // Baby diapers / formula — explicit baby intent overrides generic "milk".
  {
    re: /\b(diaper|diapers|nappy|nappies|pampers|huggies|حفاضات|ديبرز|بامبرز|رضاعة|مصاصة| baby\s+(milk|formula|food))\b/i,
    add: { baby: 2, edible: 0.4, dairy: 0.3 },
  },
  // Cookies / biscuits / cakes — a baked good, NOT a dairy spread.
  {
    re: /\b(biscuits?|cookies?|cakes?|wafer|ويفر|بسكويت|كوكيز|كعك|حلواني|جاتو|مخبوز)\b/i,
    add: { baking: 1.6, sweet: 1, snack: 1, dairy: -0.6 },
  },
  // Chocolate / candy / sweets.
  {
    re: /\b(chocolate|chocolates|candy|sweets\b|toffee|lollipop|شوكولاتة|كاندي|حلوى|سكاكر)\b/i,
    add: { sweet: 1.8, snack: 1.2, edible: 1 },
  },
  // Soft drinks / soda — beverage, explicitly NOT dairy/cheese.
  {
    re: /\b(soft\s+drink|carbonated|cola|soda|sprite|pepsi|fanta|mirinda|7up|schweppes|energy\s+drink|red\s+bull|عصير\s+غاز|مشروب\s+غاز|بيبسى|سبرايت|ميرندا)\b/i,
    add: { beverage: 2, dairy: -1, edible: 0.6 },
  },
]

// ---------------------------------------------------------------------------
// Token-level rules — word/term -> feature deltas. Accumulated after phrases.
// ---------------------------------------------------------------------------
const TOKEN_RULES: Array<{ re: RegExp; add: Partial<FeatureSignal> }> = [
  // Beverages
  { re: /\b(juice|juices|nectar|lemonade|cocktail|fizz|iced\s+tea|ice\s+tea|drink|drinks|beverage|مشروب|عصير|نسكافيه|شرب)\b/i, add: { beverage: 1.4, edible: 0.5 } },
  { re: /\b(water|مياه|صفا|سافا|عذبة|sparkling\s+water|mineral\s+water)\b/i, add: { beverage: 1.6, water: 2 } },
  { re: /\b(tea|شاي|coffee|قهوة|nescafe|nescaf|espresso|كاكاو|cocoa|مالت|malt)\b/i, add: { beverage: 1, edible: 0.8, cookingBase: 0.4 } },
  { re: /\b(honey|عسل|syrup|شربات|molasses|دبس)\b/i, add: { sweet: 0.8, edible: 0.8, condiment: 0.4 } },

  // Dairy
  { re: /\b(milk|labneh|لبن|لبنة|زبادي|yogurt|yoghurt|ألبان|حليب)\b/i, add: { dairy: 2, edible: 1, refrigerated: 1.2 } },
  { re: /\b(cheese|جبن|cheddar|mozzarella|feta|ricotta|paneer)\b/i, add: { dairy: 2, edible: 1.4, refrigerated: 1 } },
  { re: /\b(butter|زبدة|blended\s+butter|smen|samneh|ghee|سمنة|سمن)\b/i, add: { dairy: 1.6, edible: 1.1, refrigerated: 0.7 } },
  { re: /\b(cream|كريمة|قشطة|eshta|لبن\s+مكثف)\b/i, add: { dairy: 1.4, edible: 1, refrigerated: 0.9 } },

  // Cooking bases / staples
  { re: /\b(rice|أرز|pasta|macaroni|spaghetti|نودلز|noodles|vermicelli|شعرية|مكرونة|بلبن)\b/i, add: { cookingBase: 2, edible: 1 } },
  { re: /\b(flour|طحين|دقيق|سميد|semolina|خميرة|yeast)\b/i, add: { cookingBase: 1.8, baking: 1, edible: 0.8 } },
  { re: /\b(oil|زيوت|زيت|olive\s+oil|sunflower|corn\s+oil|vegetable\s+oil|shortening)\b/i, add: { cookingBase: 2, edible: 1 } },
  { re: /\b(sugar|سكر|salt|ملح|sweetener|سكرين)\b/i, add: { cookingBase: 1.8, sweet: 0.6, edible: 0.8 } },

  // Condiments / spices / sauces
  { re: /\b(spice|spices|بهارات|فلفل|pepper\s+powder|كمون|cumin|كاري|curry|قرفة|cinnamon|هيل|كراوية|بابريكا)\b/i, add: { condiment: 2, spice: 2, edible: 0.7 } },
  { re: /\b(sauce|sauces|صلصة|صوص|dressing|ketchup|mayonnaise|مايونيز|mustard|خردل|vinegar|خل)\b/i, add: { condiment: 2, sauce: 2, edible: 1 } },

  // Canned / preserved
  { re: /\b(canned|can\s+of|tin\s+of|معلبات|معلبة|تعليب|preserved|مُعلب)\b/i, add: { pantry: 1.2, edible: 1 } },

  // Frozen
  { re: /\b(frozen|مجمد|ايس\s+كريم|ice\s+cream|فريزر|مجمدات)\b/i, add: { frozen: 2, edible: 1 } },

  // Cleaning
  { re: /\b(wipes|مناديل|tissue|كلين|cleaning|تنظيف|detergent|صابون|شامبو\s+غسيل|مسحوق|bleach|مبيض|مطهر|disinfect|sponge|إسفنج|floor|أرضيات|drain|بايب|trash\s+bag|كيس\s+زبالة|garbage|مكانس|fabric\s+softener)\b/i, add: { cleaning: 2, edible: -1.5 } },

  // Personal care
  { re: /\b(shampoo|بيرسونال|عناية|كريم|لوشن|لوسيون|بودرة|مزيل\s+عرق|عطر|deodorant|soap|personal\s+care|معجون\s+أسنان|toothpaste|فرشاة\s+أسنان|بامبرز\s+body|body\s+lotion|sunscreen|واقي\s+شمس|razor|ماكينة\s+حلاقة|ماسك|face\s+mask|شامبو\s+شعر)\b/i, add: { personalCare: 2, edible: -1.2 } },

  // Baby
  { re: /\b(baby|أطفال|طفل|رضع| baby\s+)\b/i, add: { baby: 1.4, personalCare: 0.4 } },

  // Snack
  { re: /\b(chips|شيبس|بطاطس|popcorn|فشار|مكسرات|nuts\b|لوز|كاجو|سناك|snack)\b/i, add: { snack: 1.4, edible: 1 } },
]

// Brand-level hints (weak, only reinforce an already-detected feature).
const BRAND_RULES: Array<{ re: RegExp; add: Partial<FeatureSignal> }> = [
  { re: /\b(oasis|safa|صفا|baraka|عذبة|arwa|nestle\s+water|aquafina|hayat)\b/i, add: { beverage: 1 } },
  { re: /\b(juhayna|جهينة|lacnor|لقاحى|دومتي|domty)\b/i, add: { dairy: 0.8 } },
]

/**
 * Extract the product's functional feature signal from its attributes.
 * Pure and deterministic — safe to run for every product independently.
 */
export function extractFeatures(input: ProductInput): FeatureSignal {
  const text = [
    input.nameEn ?? '',
    input.nameAr ?? '',
    input.brand ?? '',
    input.description ?? '',
  ]
    .join(' ')
    .toLowerCase()

  const signal: FeatureSignal = {}
  const bump = (f: FeatureKey, w: number) => {
    signal[f] = clamp((signal[f] ?? 0) + w)
  }

  for (const rule of PHRASE_RULES) {
    if (rule.re.test(text)) {
      for (const [f, w] of Object.entries(rule.add)) bump(f as FeatureKey, w as number)
    }
  }
  for (const rule of TOKEN_RULES) {
    if (rule.re.test(text)) {
      for (const [f, w] of Object.entries(rule.add)) bump(f as FeatureKey, w as number)
    }
  }
  if (input.brand) {
    const brandText = input.brand.toLowerCase()
    for (const rule of BRAND_RULES) {
      if (rule.re.test(brandText)) {
        for (const [f, w] of Object.entries(rule.add)) bump(f as FeatureKey, w as number)
      }
    }
  }

  return signal
}
