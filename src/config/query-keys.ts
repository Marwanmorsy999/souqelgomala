/**
 * TanStack Query key factories
 *
 * Centralized query key definitions for consistent cache management.
 */

export const queryKeys = {
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
    revenueChart: () => [...queryKeys.dashboard.all, 'revenue-chart'] as const,
    ordersChart: () => [...queryKeys.dashboard.all, 'orders-chart'] as const,
    activity: () => [...queryKeys.dashboard.all, 'activity'] as const,
  },
  orders: {
    all: ['orders'] as const,
    lists: () => [...queryKeys.orders.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.orders.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.orders.all, 'detail', id] as const,
    statusHistory: (id: string) =>
      [...queryKeys.orders.all, 'status-history', id] as const,
    timeline: (id: string) => [...queryKeys.orders.all, 'timeline', id] as const,
    counts: () => [...queryKeys.orders.all, 'counts'] as const,
  },
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.products.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.products.all, 'detail', id] as const,
    lowStock: () => [...queryKeys.products.all, 'low-stock'] as const,
    featured: () => [...queryKeys.products.all, 'featured'] as const,
  },
  categories: {
    all: ['categories'] as const,
    tree: () => [...queryKeys.categories.all, 'tree'] as const,
    list: () => [...queryKeys.categories.all, 'list'] as const,
  },
  customers: {
    all: ['customers'] as const,
    lists: () => [...queryKeys.customers.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.customers.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.customers.all, 'detail', id] as const,
  },
  offers: {
    all: ['offers'] as const,
    lists: () => [...queryKeys.offers.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.offers.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.offers.all, 'detail', id] as const,
  },
  delivery: {
    all: ['delivery'] as const,
    drivers: () => [...queryKeys.delivery.all, 'drivers'] as const,
    areas: () => [...queryKeys.delivery.all, 'areas'] as const,
    assignments: () => [...queryKeys.delivery.all, 'assignments'] as const,
  },
  branches: {
    all: ['branches'] as const,
    list: () => [...queryKeys.branches.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.branches.all, 'detail', id] as const,
  },
  employees: {
    all: ['employees'] as const,
    list: () => [...queryKeys.employees.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.employees.all, 'detail', id] as const,
  },
  reports: {
    all: ['reports'] as const,
    sales: (range: string) => [...queryKeys.reports.all, 'sales', range] as const,
    topProducts: (range: string) =>
      [...queryKeys.reports.all, 'top-products', range] as const,
    topCategories: (range: string) =>
      [...queryKeys.reports.all, 'top-categories', range] as const,
    topCities: (range: string) =>
      [...queryKeys.reports.all, 'top-cities', range] as const,
  },
  settings: {
    all: ['settings'] as const,
    store: () => [...queryKeys.settings.all, 'store'] as const,
    delivery: () => [...queryKeys.settings.all, 'delivery'] as const,
    invoice: () => [...queryKeys.settings.all, 'invoice'] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: () => [...queryKeys.notifications.all, 'list'] as const,
    unread: () => [...queryKeys.notifications.all, 'unread'] as const,
  },
  suppliers: {
    all: ['suppliers'] as const,
    lists: () => [...queryKeys.suppliers.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.suppliers.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.suppliers.all, 'detail', id] as const,
  },
  purchaseOrders: {
    all: ['purchase-orders'] as const,
    lists: () => [...queryKeys.purchaseOrders.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.purchaseOrders.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.purchaseOrders.all, 'detail', id] as const,
  },
  inventory: {
    all: ['inventory'] as const,
    movements: () => [...queryKeys.inventory.all, 'movements'] as const,
    movementsByProduct: (productId: string) =>
      [...queryKeys.inventory.all, 'movements', productId] as const,
    stockLevels: () => [...queryKeys.inventory.all, 'stock-levels'] as const,
  },
  returns: {
    all: ['returns'] as const,
    lists: () => [...queryKeys.returns.all, 'list'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.returns.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.returns.all, 'detail', id] as const,
  },
  featureFlags: {
    all: ['feature-flags'] as const,
    list: () => [...queryKeys.featureFlags.all, 'list'] as const,
    groups: () => [...queryKeys.featureFlags.all, 'groups'] as const,
  },
  auth: {
    all: ['auth'] as const,
    profile: () => [...queryKeys.auth.all, 'profile'] as const,
  },
  activity: {
    all: ['activity'] as const,
    recent: () => [...queryKeys.activity.all, 'recent'] as const,
  },
} as const

