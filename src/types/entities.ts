/**
 * Souk El Gomla — Domain Entity Types
 *
 * These are the domain models used by the application layer.
 * They map to database rows but add derived/computed fields and
 * feature-specific shapes. Business logic should operate on these,
 * not raw database rows.
 */

import type {
  OrderRow,
  OrderItemRow,
  ProductRow,
  CustomerRow,
  CategoryRow,
  OrderStatus,
  PaymentMethod,
  MovementType,
  PurchaseOrderStatus,
  ReturnStatus,
} from './database'

// ============================================
// ORDERS
// ============================================

/** Line item presented in the UI */
export interface OrderLineItem {
  id: string
  productId: string | null
  nameAr: string
  nameEn?: string | null
  quantity: number
  unitPrice: number
  total: number
  imageUrl?: string | null
}

/** Order summary for list/table views */
export interface OrderSummary {
  id: string
  orderNumber: string
  status: OrderStatus
  customerName: string
  customerPhone: string | null
  customerAddress: string | null
  paymentMethod: PaymentMethod | null
  subtotal: number
  discount: number
  deliveryFee: number
  total: number
  driverName: string | null
  createdAt: string
  updatedAt: string
}

/** Full order detail including items and history */
export interface OrderDetail extends OrderSummary {
  items: OrderLineItem[]
  statusHistory: Array<{
    fromStatus: OrderStatus | null
    toStatus: OrderStatus
    note: string | null
    changedBy: string | null
    createdAt: string
  }>
  timeline: Array<{
    type: string
    note: string | null
    actorId: string | null
    createdAt: string
  }>
  notes?: string | null
}

/** Payload for creating a new order */
export interface CreateOrderInput {
  customerId?: string | null
  customerName: string
  customerPhone: string
  customerAddress: string
  branchId?: string | null
  paymentMethod: PaymentMethod
  items: Array<{
    productId: string
    quantity: number
  }>
  deliveryFee?: number
  discount?: number
  notes?: string | null
}

/** Payload for advancing order status */
export interface UpdateOrderStatusInput {
  orderId: string
  toStatus: OrderStatus
  note?: string | null
}

// ============================================
// PRODUCTS
// ============================================

/** Product status derived from stock levels for UI */
export type ProductAvailability = 'available' | 'low' | 'out'

/** Product row extended with derived availability */
export interface ProductWithAvailability extends ProductRow {
  availability: ProductAvailability
}

/** Product form model (maps 1:1 to DB row) */
export interface ProductFormValues {
  nameAr: string
  nameEn?: string
  description?: string
  brand?: string
  categoryId?: string
  barcode?: string
  sku?: string
  price: number // retail
  offerPrice?: number | null // promotional price
  wholesalePrice?: number | null // wholesale price
  compareAtPrice?: number | null // original/comparison price
  costPrice?: number | null
  unit: string
  weight?: number | null
  stock: number
  minStock: number
  isFeatured: boolean
  isNewArrival: boolean
  isBestSeller: boolean
  isVisible: boolean
  status: ProductRow['status']
  media?: Array<{
    id: string
    cloudinaryPublicId: string
    secureUrl: string
    alt?: string | null
    displayOrder: number
    isPrimary: boolean
    width?: number | null
    height?: number | null
    format?: string | null
  }>
  tags?: string[]
}

/** Bulk product operation payloads */
export interface BulkProductUpdate {
  ids: string[]
  patch: Partial<Pick<ProductRow, 'price' | 'stock' | 'status' | 'is_visible'>>
}

// ============================================
// CUSTOMERS
// ============================================

/** Customer with computed VIP/blacklist flags */
export interface CustomerSummary extends CustomerRow {
  statusLabel: 'vip' | 'normal' | 'blacklisted'
}

/** Customer detail with addresses + recent orders */
export interface CustomerProfile extends CustomerSummary {
  addresses?: Array<{
    id: string
    label: string | null
    city: string
    address: string
    isDefault: boolean
  }>
  recentOrders?: OrderSummary[]
}

// ============================================
// CATEGORIES
// ============================================

/** Category with children for tree rendering */
export interface CategoryNode {
  id: string
  nameAr: string
  nameEn?: string | null
  parentId: string | null
  image?: string | null
  sortOrder: number
  isVisible: boolean
  productCount?: number
  children: CategoryNode[]
}

// ============================================
// FORMS (React Hook Form + Zod)
// ============================================

/** Order filter state for list views */
export interface OrderFilters {
  status?: OrderStatus | 'all'
  search?: string
  dateFrom?: string
  dateTo?: string
  paymentMethod?: PaymentMethod | 'all'
  city?: string
}

/** Product filter state for list views */
export interface ProductFilters {
  search?: string
  categoryId?: string
  status?: ProductRow['status'] | 'all'
  availability?: ProductAvailability | 'all'
  brand?: string
  minPrice?: number
  maxPrice?: number
}

// ============================================
// SUPPLIERS & PURCHASE ORDERS
// ============================================

/** Supplier list summary */
export interface SupplierSummary {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  paymentTerms: string | null
  isActive: boolean
  createdAt: string
}

/** Purchase order detail with line items */
export interface PurchaseOrderDetail {
  id: string
  poNumber: string
  supplierId: string | null
  supplierName?: string | null
  status: PurchaseOrderStatus
  expectedDate: string | null
  receivedDate: string | null
  subtotal: number
  tax: number
  discount: number
  total: number
  notes: string | null
  createdBy: string | null
  items: Array<{
    id: string
    productId: string | null
    productName?: string | null
    quantity: number
    unitCost: number
    total: number
  }>
  createdAt: string
}

/** Payload for creating a purchase order */
export interface CreatePurchaseOrderInput {
  supplierId: string | null
  expectedDate?: string | null
  discount?: number
  tax?: number
  notes?: string | null
  items: Array<{
    productId: string
    quantity: number
    unitCost: number
  }>
}

// ============================================
// INVENTORY
// ============================================

/** Inventory movement presented in the UI */
export interface InventoryMovementSummary {
  id: string
  productId: string
  productNameAr?: string | null
  productNameEn?: string | null
  movementType: MovementType
  quantity: number
  reason: string | null
  referenceType: string | null
  referenceId: string | null
  createdBy: string | null
  createdAt: string
}

// ============================================
// RETURNS
// ============================================

/** Return summary for list views */
export interface ReturnSummary {
  id: string
  returnNumber: string
  orderId: string | null
  customerId: string | null
  customerName?: string | null
  status: ReturnStatus
  reason: string | null
  totalRefund: number
  createdAt: string
}

/** Full return detail with items */
export interface ReturnDetail extends ReturnSummary {
  items: Array<{
    id: string
    productId: string | null
    productNameAr?: string | null
    quantity: number
    unitPrice: number
    total: number
  }>
}

// ============================================
// FEATURE FLAGS
// ============================================

/** Feature flag grouped by module area */
export interface FeatureFlagSummary {
  id: string
  key: string
  groupId: string | null
  groupName?: string | null
  label: string
  description: string | null
  isEnabled: boolean
  value: Record<string, unknown> | null
}

// ============================================
// REUSABLE PAGINATION
// ============================================

export interface PaginationState {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface SortState {
  column: string
  direction: 'asc' | 'desc'
}

export interface QueryTableState {
  filters: Record<string, unknown>
  sort: SortState
  pagination: PaginationState
}

