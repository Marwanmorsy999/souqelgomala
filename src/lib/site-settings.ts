/**
 * Site settings — the single, typed contract for business info that the admin
 * can edit and the storefront renders.
 *
 * This module is CLIENT-SAFE (no DB bindings). It only defines:
 *   - the `SiteSettings` shape
 *   - `DEFAULT_SITE_SETTINGS` (the current values from lib/site.ts — the
 *     known business facts; nothing here is invented)
 *   - `normalizeSiteSettings()` — merges a partial/raw D1 payload over the
 *     defaults so missing keys keep their existing site behavior.
 *
 * The server service (`src/services/settings.ts`) persists a `site` row in the
 * D1 `settings` table; the storefront reads the merged result from `GET
 * /api/site` (KV cached, falling back to these defaults).
 */

export interface SiteSocialLinks {
  facebook: string
  instagram: string
  tiktok: string
}

export interface SiteHeroContent {
  /** Direct image URL shown as the hero background (empty = branded fallback). */
  image?: string
  /** Hero headline — falls back to `tagline` when empty. */
  title?: string
  /** Hero supporting sentence. */
  description?: string
  /** Primary CTA label (shop daily offers). */
  ctaLabel?: string
  /** Secondary CTA label (WhatsApp). */
  whatsappCtaLabel?: string
  /** Accessible label for the hero photo. */
  alt?: string
}

export interface SiteSettings {
  /** Business display name (Arabic). */
  name: string
  /** Business name (English). */
  nameEn: string
  /** Short slogan under the name. */
  tagline: string
  /** Business description / meta. */
  description: string
  /** Human-readable location line. */
  location: string
  /** Concise address lines (each rendered on its own line). */
  addressLines: string[]
  /** Main phone (display + tel: link). */
  phoneMain: string
  /** Alternate phone (display + tel: link). */
  phoneAlt: string
  /** WhatsApp number in international format (leading + dropped). */
  whatsapp: string
  /** Official social profile links. */
  social: SiteSocialLinks
  /** Hero / homepage content. */
  hero: SiteHeroContent
  /**
   * Operational switches — every toggle updates global state immediately
   * (persisted via PUT /api/admin/settings, KV cache invalidated).
   */
  ops: SiteOpsSettings
}

export interface SiteOpsSettings {
  /** Show the maintenance screen to storefront visitors. */
  maintenanceMode: boolean
  /** Accept new orders from the storefront checkout. */
  ordersEnabled: boolean
  /** Apply tax on order totals. */
  taxEnabled: boolean
  /** Tax percentage applied when taxEnabled is on (0-100). */
  taxRate: number
}

const INITIAL_SOCIAL: SiteSocialLinks = {
  facebook: 'https://www.facebook.com/share/1FZUWgbRkR/',
  instagram: 'https://www.instagram.com/soukelgomla?igsh=c2xiNHB4NmN6ZWx5',
  tiktok: 'https://www.tiktok.com/@soukelgomla?_r=1&_t=ZS-98iXStBXwBw',
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  name: 'سوق الجملة',
  nameEn: 'Souk Elgomla',
  tagline: 'وفر العملة واشتري من الجملة',
  description: 'منتجات غذائية ومنزلية بأسعار الجملة للجميع.',
  location: 'كفر شكر، القليوبية، مصر',
  addressLines: [
    'شارع جمال عبد الناصر — خلف مسجد آل عطا الله',
    'ميدان كفر شكر — المساكن أمام مكتب العمل',
    'بجوار كافيتريا الملوك',
  ],
  phoneMain: '01222464999',
  phoneAlt: '01090787378',
  whatsapp: '201222464999',
  social: { ...INITIAL_SOCIAL },
  hero: {
    image: '',
    title: '',
    description: 'بقالة جملة وقطاعي في كفر شكر — بنبيع كل يوم بأسعار الجملة للبيت والمحل.',
    ctaLabel: 'شوف عروض النهارده',
    whatsappCtaLabel: 'اطلب على واتساب',
    alt: 'واجهة محل سوق الجملة — كفر شكر، القليوبية',
  },
  ops: {
    maintenanceMode: false,
    ordersEnabled: true,
    taxEnabled: false,
    taxRate: 14,
  },
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function strArr(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string')
  }
  if (typeof value === 'string' && value.trim()) {
    return value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
  }
  return []
}

/**
 * Merge a raw/partial payload (from the D1 `settings` table) over the defaults.
 * Every missing/invalid value keeps its default, so the storefront always
 * renders real, complete business info — never empty or fake fields.
 */
export function normalizeSiteSettings(raw: unknown): SiteSettings {
  const value = (raw ?? {}) as Record<string, unknown>
  const social = (value.social ?? {}) as Record<string, unknown>
  const hero = (value.hero ?? {}) as Record<string, unknown>
  const ops = (value.ops ?? {}) as Record<string, unknown>

  const taxRateRaw = Number(ops.taxRate)

  return {
    name: str(value.name) || DEFAULT_SITE_SETTINGS.name,
    nameEn: str(value.nameEn) || DEFAULT_SITE_SETTINGS.nameEn,
    tagline: str(value.tagline) || DEFAULT_SITE_SETTINGS.tagline,
    description: str(value.description) || DEFAULT_SITE_SETTINGS.description,
    location: str(value.location) || DEFAULT_SITE_SETTINGS.location,
    addressLines: strArr(value.addressLines).length
      ? strArr(value.addressLines)
      : [...DEFAULT_SITE_SETTINGS.addressLines],
    phoneMain: str(value.phoneMain) || DEFAULT_SITE_SETTINGS.phoneMain,
    phoneAlt: str(value.phoneAlt) || DEFAULT_SITE_SETTINGS.phoneAlt,
    whatsapp: str(value.whatsapp) || DEFAULT_SITE_SETTINGS.whatsapp,
    social: {
      facebook: str(social.facebook) || DEFAULT_SITE_SETTINGS.social.facebook,
      instagram: str(social.instagram) || DEFAULT_SITE_SETTINGS.social.instagram,
      tiktok: str(social.tiktok) || DEFAULT_SITE_SETTINGS.social.tiktok,
    },
    hero: {
      image: str(hero.image) || DEFAULT_SITE_SETTINGS.hero.image,
      title: str(hero.title) || DEFAULT_SITE_SETTINGS.hero.title,
      description: str(hero.description) || DEFAULT_SITE_SETTINGS.hero.description,
      ctaLabel: str(hero.ctaLabel) || DEFAULT_SITE_SETTINGS.hero.ctaLabel,
      whatsappCtaLabel: str(hero.whatsappCtaLabel) || DEFAULT_SITE_SETTINGS.hero.whatsappCtaLabel,
      alt: str(hero.alt) || DEFAULT_SITE_SETTINGS.hero.alt,
    },
    ops: {
      maintenanceMode: typeof ops.maintenanceMode === 'boolean' ? ops.maintenanceMode : DEFAULT_SITE_SETTINGS.ops.maintenanceMode,
      ordersEnabled: typeof ops.ordersEnabled === 'boolean' ? ops.ordersEnabled : DEFAULT_SITE_SETTINGS.ops.ordersEnabled,
      taxEnabled: typeof ops.taxEnabled === 'boolean' ? ops.taxEnabled : DEFAULT_SITE_SETTINGS.ops.taxEnabled,
      taxRate:
        Number.isFinite(taxRateRaw) && taxRateRaw >= 0 && taxRateRaw <= 100
          ? taxRateRaw
          : DEFAULT_SITE_SETTINGS.ops.taxRate,
    },
  }
}

/** Convenience: build a WhatsApp deep-link from the international number. */
export function whatsappLink(number: string): string {
  const digits = str(number).replace(/[^\d]/g, '')
  return `https://wa.me/${digits || DEFAULT_SITE_SETTINGS.whatsapp}`
}