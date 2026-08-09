/**
 * Application-wide constants
 */

import type {
  MovementType,
  OrderSource,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductStatus,
  PurchaseOrderStatus,
  ReturnStatus,
} from '@/types/database'

// ============================================
// APP
// ============================================

export const APP_NAME_AR = 'سوق الجملة'
export const APP_NAME_EN = 'Souk El Gomla'
export const APP_CURRENCY = 'ج.م'
export const APP_LOCALE = 'ar-EG'

// ============================================
// ORDER STATUS
// ============================================

/** Ordered lifecycle of order statuses */
export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'new',
  'accepted',
  'preparing',
  'packed',
  'out_for_delivery',
  'delivered',
]

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'جديد',
  accepted: 'مقبول',
  preparing: 'قيد التجهيز',
  packed: 'تم التغليف',
  out_for_delivery: 'خرج للتوصيل',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
}

/** Statuses that count as "active" (not terminal) */
export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  'new',
  'accepted',
  'preparing',
  'packed',
  'out_for_delivery',
]

/** Terminal statuses (no further progression) */
export const TERMINAL_ORDER_STATUSES: OrderStatus[] = ['delivered', 'cancelled']

/** Next status in the flow (for "advance" action) */
export function getNextOrderStatus(status: OrderStatus): OrderStatus | null {
  const index = ORDER_STATUS_FLOW.indexOf(status)
  return index >= 0 && index < ORDER_STATUS_FLOW.length - 1
    ? ORDER_STATUS_FLOW[index + 1]
    : null
}

// ============================================
// PAYMENT METHODS
// ============================================

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'كاش',
  card: 'بطاقة',
  wallet: 'محفظة',
  bank_transfer: 'تحويل بنكي',
}

// ============================================
// ORDER SOURCE
// ============================================

export const ORDER_SOURCE_LABELS: Record<OrderSource, string> = {
  website: 'الموقع الإلكتروني',
  mobile: 'تطبيق الموبايل',
  admin: 'لوحة التحكم',
  whatsapp: 'واتساب',
  facebook: 'فيسبوك',
}

// ============================================
// PAYMENT STATUS
// ============================================

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'قيد الانتظار',
  paid: 'مدفوع',
  failed: 'فشل الدفع',
  refunded: 'مسترجع',
}

export const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
}

// ============================================
// INVENTORY MOVEMENT TYPES
// ============================================

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  purchase: 'شراء',
  sale: 'بيع',
  return: 'مرتجع',
  adjustment: 'تسوية',
  transfer_in: 'تحويل وارد',
  transfer_out: 'تحويل صادر',
  initial_stock: 'رصيد افتتاحي',
}

// ============================================
// PURCHASE ORDER STATUS
// ============================================

export const PURCHASE_ORDER_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  draft: 'مسودة',
  ordered: 'تم الطلب',
  partial: 'استلام جزئي',
  received: 'تم الاستلام',
  cancelled: 'ملغي',
}

export const PURCHASE_ORDER_STATUS_STYLES: Record<PurchaseOrderStatus, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  ordered: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  received: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}

// ============================================
// RETURN STATUS
// ============================================

export const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  pending: 'قيد المراجعة',
  approved: 'تمت الموافقة',
  rejected: 'مرفوض',
  completed: 'مكتمل',
}

export const RETURN_STATUS_STYLES: Record<ReturnStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
}

// ============================================
// FEATURE FLAGS
// ============================================

export const FEATURE_FLAG_KEYS = {
  WISHLIST: 'wishlist',
  REVIEWS: 'reviews',
  LOYALTY: 'loyalty',
  COUPONS: 'coupons',
  INVENTORY: 'inventory',
  SUPPLIERS: 'suppliers',
  PURCHASE_ORDERS: 'purchase_orders',
  RETURNS: 'returns',
  AI_ASSISTANT: 'ai_assistant',
} as const

export type FeatureFlagKey = (typeof FEATURE_FLAG_KEYS)[keyof typeof FEATURE_FLAG_KEYS]

export const FEATURE_FLAG_GROUPS = {
  CUSTOMER: 'customer',
  MARKETING: 'marketing',
  OPERATIONS: 'operations',
  AI: 'ai',
} as const

// ============================================
// PRODUCT STATUS
// ============================================

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  active: 'متاح',
  inactive: 'غير متاح',
  archived: 'مؤرشف',
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export const NOTIFICATION_TYPES = {
  LOW_STOCK: 'low_stock',
  NEW_ORDER: 'new_order',
  CANCELLED_ORDER: 'cancelled_order',
  OFFER_ENDING: 'offer_ending',
  DELIVERY_DELAY: 'delivery_delay',
  SYSTEM: 'system',
} as const

// ============================================
// PAGINATION
// ============================================

export const DEFAULT_PAGE_SIZE = 20
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

// ============================================
// STORAGE
// ============================================

export const STORAGE_BUCKETS = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  OFFERS: 'offers',
  PROFILES: 'profiles',
  BRANCHES: 'branches',
} as const

// ============================================
// DATE RANGES
// ============================================

export const DATE_RANGE_OPTIONS = [
  { label: 'آخر 7 أيام', value: '7d' },
  { label: 'آخر 14 يوم', value: '14d' },
  { label: 'آخر 30 يوم', value: '30d' },
  { label: 'آخر 90 يوم', value: '90d' },
  { label: 'هذا الشهر', value: 'this_month' },
  { label: 'الشهر الماضي', value: 'last_month' },
] as const

// ============================================
// LOW STOCK
// ============================================

export const LOW_STOCK_THRESHOLD_DEFAULT = 10
