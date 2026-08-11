/**
 * Admin route definitions
 *
 * Central registry of all admin routes. Keeps route strings
 * in one place to avoid magic strings across the codebase.
 */

export const ADMIN_ROUTES = {
  LOGIN: '/admin/login',
  DASHBOARD: '/admin',
  ORDERS: '/admin/orders',
  ORDERS_DETAIL: (id: string) => `/admin/orders/${id}`,
  PRODUCTS: '/admin/products',
  PRODUCTS_NEW: '/admin/products/new',
  PRODUCTS_DETAIL: (id: string) => `/admin/products/${id}`,
  PRODUCTS_IMPORT: '/admin/products/import',
  PRODUCTS_IMAGES_BULK: '/admin/products/images/bulk',
  PRODUCTS_PDF_IMPORT: '/admin/products/pdf-import',
  CATEGORIES: '/admin/categories',
  OFFERS: '/admin/offers',
  OFFERS_DETAIL: (id: string) => `/admin/offers/${id}`,
  CUSTOMERS: '/admin/customers',
  CUSTOMERS_DETAIL: (id: string) => `/admin/customers/${id}`,
  DELIVERY: '/admin/delivery',
  DELIVERY_DRIVERS: '/admin/delivery/drivers',
  DELIVERY_AREAS: '/admin/delivery/areas',
  BRANCHES: '/admin/branches',
  BRANCHES_DETAIL: (id: string) => `/admin/branches/${id}`,
  EMPLOYEES: '/admin/employees',
  EMPLOYEES_DETAIL: (id: string) => `/admin/employees/${id}`,
  EMPLOYEES_PERMISSIONS: (id: string) => `/admin/employees/${id}/permissions`,
  PROMOS: '/admin/promos',
  MEDIA: '/admin/media',
  REPORTS: '/admin/reports',
  SETTINGS: '/admin/settings',
} as const

export type AdminRoute = (typeof ADMIN_ROUTES)[keyof typeof ADMIN_ROUTES]

