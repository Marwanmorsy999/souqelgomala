export type Product = {
  id: string
  name: string
  english: string
  size: string
  retail: number
  wholesale: number
  category: string
  inStock: boolean
  image: string
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

export type StoreFeature = {
  id: string
  title: string
  description: string
}
