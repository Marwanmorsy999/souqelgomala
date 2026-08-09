/**
 * Souk El Gomla — Database Types
 *
 * These types mirror the Drizzle schema.
 * In production, generate these with: drizzle-kit generate
 *
 * Canonical role type lives in `src/db/schema/auth.ts` (exported as `UserRole`).
 * Export as `Role` here for application-layer convenience.
 */

export type { Role }
import type { UserRole as Role } from '@/db/schema/auth'

export type OrderStatus =
  | 'new'
  | 'accepted'
  | 'preparing'
  | 'packed'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'

export type PaymentMethod = 'cash' | 'card' | 'wallet' | 'bank_transfer'

export type DiscountType = 'percentage' | 'fixed_price' | 'buy_x_get_y'

export type ProductStatus = 'active' | 'inactive' | 'archived'

export type OfferStatus = 'active' | 'inactive' | 'scheduled' | 'expired'

export type DriverStatus = 'available' | 'busy' | 'offline'

export type OrderSource = 'website' | 'mobile' | 'admin' | 'whatsapp' | 'facebook'

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export type MovementType =
  | 'purchase'
  | 'sale'
  | 'return'
  | 'adjustment'
  | 'transfer_in'
  | 'transfer_out'
  | 'initial_stock'

export type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'completed'

export type PurchaseOrderStatus = 'draft' | 'ordered' | 'partial' | 'received' | 'cancelled'


// ============================================
// TABLE ROW TYPES
// ============================================

export interface BranchRow {
  id: string
  name_ar: string
  name_en: string | null
  code: string | null
  address: string | null
  phone: string | null
  working_hours: Record<string, { open: string; close: string }> | null
  latitude: number | null
  longitude: number | null
  google_maps_url: string | null
  manager_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface ProfileRow {
  id: string
  email: string | null
  full_name: string
  phone: string | null
  role: Role
  avatar: string | null
  branch_id: string | null
  is_active: boolean
  last_login_at: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface CategoryRow {
  id: string
  name_ar: string
  name_en: string | null
  parent_id: string | null
  image: string | null
  sort_order: number
  is_visible: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface ProductRow {
  id: string
  barcode: string | null
  sku: string | null
  slug: string | null
  name_ar: string
  name_en: string | null
  description: string | null
  brand: string | null
  category_id: string | null
  price: number // retail
  offer_price: number | null // promotional price
  wholesale_price: number | null // wholesale price
  compare_at_price: number | null // original/comparison price
  cost_price: number | null
  unit: string
  weight: number | null
  stock: number
  min_stock: number
  display_order: number
  image_alt: string | null
  is_featured: boolean
  is_new_arrival: boolean
  is_best_seller: boolean
  is_visible: boolean
  status: ProductStatus
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type MediaResourceType = 'image' | 'video' | 'auto'

export interface ProductMediaRow {
  id: string
  product_id: string
  cloudinary_public_id: string
  secure_url: string
  width: number | null
  height: number | null
  format: string | null
  resource_type: MediaResourceType
  alt: string | null
  display_order: number
  is_primary: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface CategoryMediaRow {
  id: string
  category_id: string
  cloudinary_public_id: string
  secure_url: string
  width: number | null
  height: number | null
  format: string | null
  resource_type: MediaResourceType
  alt: string | null
  display_order: number
  is_primary: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface ProductTagRow {
  id: string
  product_id: string
  tag: string
  created_at: string
}

export interface CustomerRow {
  id: string
  phone: string
  name: string | null
  email: string | null
  total_spending: number
  average_order: number
  order_count: number
  is_vip: boolean
  is_blacklisted: boolean
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface CustomerAddressRow {
  id: string
  customer_id: string
  label: string | null
  city: string
  address: string
  latitude: number | null
  longitude: number | null
  is_default: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface OrderRow {
  id: string
  order_number: string
  customer_id: string | null
  customer_name: string | null
  customer_phone: string | null
  customer_address: string | null
  branch_id: string | null
  status: OrderStatus
  source: OrderSource
  payment_status: PaymentStatus
  payment_method: PaymentMethod | null
  subtotal: number
  discount: number
  delivery_fee: number
  total: number
  driver_id: string | null
  assigned_driver_name: string | null
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface OrderItemRow {
  id: string
  order_id: string
  product_id: string | null
  name_ar: string
  name_en: string | null
  quantity: number
  unit_price: number
  total: number
  created_at: string
}

export interface OrderStatusHistoryRow {
  id: string
  order_id: string
  from_status: OrderStatus | null
  to_status: OrderStatus
  changed_by: string | null
  note: string | null
  created_at: string
}

export interface OrderTimelineRow {
  id: string
  order_id: string
  type: string
  note: string | null
  actor_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface OfferRow {
  id: string
  banner: string | null
  campaign_name: string
  discount_type: DiscountType
  value: number | null
  buy_x: number | null
  get_y: number | null
  /** Stored as JSON TEXT in D1 — parse with `parseOfferProductIds()` */
  product_ids: string
  start_date: string
  end_date: string
  status: OfferStatus
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface DeliveryDriverRow {
  id: string
  name: string
  phone: string
  vehicle: string | null
  branch_id: string | null
  status: DriverStatus
  current_order_id: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface DeliveryAreaRow {
  id: string
  name: string
  city: string
  fee: number
  min_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface DeliveryAssignmentRow {
  id: string
  order_id: string
  driver_id: string | null
  assigned_by: string | null
  status: 'assigned' | 'picked_up' | 'delivered' | 'returned'
  notes: string | null
  assigned_at: string
  created_at: string
}

export interface ActivityLogRow {
  id: string
  user_id: string | null
  action: string
  entity: string
  entity_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface NotificationRow {
  id: string
  user_id: string | null
  type: string
  title: string
  body: string | null
  severity: 'info' | 'warning' | 'error' | 'success'
  is_read: boolean
  read_at: string | null
  entity: string | null
  entity_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface SettingsRow {
  id: string
  key: string
  value: Record<string, unknown>
  description: string | null
  created_at: string
  updated_at: string
}

// ============================================
// SUPPLIERS & PURCHASE ORDERS
// ============================================

export interface SupplierRow {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  tax_id: string | null
  payment_terms: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface PurchaseOrderRow {
  id: string
  po_number: string
  supplier_id: string | null
  status: PurchaseOrderStatus
  expected_date: string | null
  received_date: string | null
  subtotal: number
  tax: number
  discount: number
  total: number
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface PurchaseOrderItemRow {
  id: string
  purchase_order_id: string
  product_id: string | null
  quantity: number
  unit_cost: number
  total: number
  created_at: string
}

// ============================================
// INVENTORY MOVEMENTS
// ============================================

export interface InventoryMovementRow {
  id: string
  product_id: string
  movement_type: MovementType
  quantity: number
  reason: string | null
  reference_type: string | null
  reference_id: string | null
  created_by: string | null
  created_at: string
}

// ============================================
// RETURNS
// ============================================

export interface ReturnRow {
  id: string
  return_number: string
  order_id: string | null
  customer_id: string | null
  status: ReturnStatus
  reason: string | null
  total_refund: number
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface ReturnItemRow {
  id: string
  return_id: string
  product_id: string | null
  quantity: number
  unit_price: number
  total: number
  created_at: string
}

// ============================================
// FEATURE FLAGS
// ============================================

export interface FeatureGroupRow {
  id: string
  name: string
  description: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface FeatureFlagRow {
  id: string
  key: string
  group_id: string | null
  label: string
  description: string | null
  is_enabled: boolean
  value: Record<string, unknown> | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// ============================================
// COMPOSITE / VIEW TYPES
// ============================================

/** Order with joined items for detail views */
export interface OrderWithItems extends OrderRow {
  items: OrderItemRow[]
  status_history?: OrderStatusHistoryRow[]
  timeline?: OrderTimelineRow[]
}

/** Product with joined category + media for listing/detail */
export interface ProductWithRelations extends ProductRow {
  category?: CategoryRow | null
  media?: ProductMediaRow[]
  tags?: ProductTagRow[]
}

/** Customer with aggregate metrics for CRM */
export interface CustomerWithMetrics extends CustomerRow {
  addresses?: CustomerAddressRow[]
  recent_orders?: OrderRow[]
}

/** Category tree node for nested rendering */
export interface CategoryTreeNode extends CategoryRow {
  children: CategoryTreeNode[]
}

/** Dashboard aggregate response (from Edge Function or RPC) */
export interface DashboardStats {
  today_revenue: number
  today_orders: number
  pending_orders: number
  preparing_orders: number
  ready_orders: number
  out_for_delivery: number
  delivered_orders: number
  cancelled_orders: number
  low_stock_count: number
  average_order_value: number
}



