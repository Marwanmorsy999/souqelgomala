export type Product = {
  id: string
  /** Arabic display name (from D1 `name_ar`). */
  name: string
  /** Canonical Arabic name alias (DB `name_ar`). Optional on the domain type so
   *  legacy/mock data without the full canonical shape still typechecks. */
  name_ar?: string
  english: string
  /** Display unit label (e.g. "كيلو", "علبة"). Empty for the default `piece`. */
  size: string
  /** Canonical unit alias (DB `unit`). */
  unit?: string
  /** Retail price (DB `price`). */
  retail: number
  /** Canonical retail price alias (DB `price`). */
  price?: number
  /** Wholesale price (DB `wholesale_price`). */
  wholesale: number
  /** Canonical wholesale price alias (DB `wholesale_price`). */
  wholesale_price?: number
  /** Category display name. */
  category: string
  /** Canonical category id (DB `category_id`). */
  category_id?: string | null
  inStock: boolean
  /** Primary image URL. */
  image: string
  /** Canonical image URL alias. */
  image_url?: string
  /** Optional previous (higher) price. When present, a discount badge is rendered. */
  oldPrice?: number
  /** Optional brand label (shown on the card when available). */
  brand?: string
  /** Optional product description (from D1) used on detail + SEO. */
  description?: string
  /** Optional product slug (from D1) used for SEO / canonical URLs. */
  slug?: string
  /** Optional SKU (from D1) used for SEO / inventory references. */
  sku?: string
}

export type CartItem = {
  id: string
  quantity: number
}

export type Order = {
  id: string
  status: 'delivered' | 'preparing' | 'cancelled' | 'on_delivery'
  date: string
  total: number
  items: { id: string; quantity: number }[]
  address: string
  delivery: string
}

export type UserType = 'customer' | 'wholesale'
export type View = 'home' | 'category' | 'cart' | 'orders' | 'checkout'

export type Category = {
  id: string
  name: string
  image: string
}

/**
 * A campaign-level promotion from the D1 `offers` table.
 * Products referenced by the campaign are resolved at query time.
 */
export type Offer = {
  id: string
  title: string
  description?: string
  banner?: string
  discountType: 'percentage' | 'fixed_price' | 'buy_x_get_y'
  value?: number
  buyX?: number
  getY?: number
  startDate: string
  endDate: string
  status: 'active' | 'inactive' | 'scheduled' | 'expired'
  products: Product[]
}

export type Testimonial = {
  id: string
  name: string
  role: string
  text: string
  /** Marked demo when the review is not verified/real. */
  demo?: boolean
}

export type FaqItem = {
  id: string
  q: string
  a: string
  /** Set when the answer is editable via settings later (may vary by store). */
  editable?: boolean
}

export type PaymentMethod = {
  id: string
  label: string
  note?: string
  available: boolean
}

export type Brand = {
  id: string
  name: string
  name_en: string
  logo_url: string
}

export type StoreFeature = {
  id: string
  title: string
  description: string
}
