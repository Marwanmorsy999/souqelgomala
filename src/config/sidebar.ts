/**
 * Sidebar navigation configuration
 *
 * Defines the complete sidebar tree with icons, labels, route paths,
 * and permission requirements. Icons reference lucide-react icon names.
 */

import type { FeatureFlagKey } from '@/lib/constants'

export interface SidebarItem {
  label: string
  icon: string        // lucide-react icon name
  path: string
  permission?: string
  /** Feature flag key — item is hidden while the flag is disabled. */
  featureFlag?: FeatureFlagKey
  badge?: 'count' | 'low_stock'
  children?: Omit<SidebarItem, 'children'>[]
}

export interface SidebarSection {
  title?: string
  items: SidebarItem[]
}

export const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    items: [
      {
        label: 'نظرة عامة',
        icon: 'LayoutDashboard',
        path: '/admin',
        permission: 'dashboard.read',
      },
      {
        label: 'الطلبات',
        icon: 'ClipboardList',
        path: '/admin/orders',
        permission: 'orders.read',
        badge: 'count',
      },
      {
        label: 'المنتجات',
        icon: 'Package',
        path: '/admin/products',
        permission: 'products.read',
      },
      {
        label: 'الفئات',
        icon: 'FolderTree',
        path: '/admin/categories',
        permission: 'categories.read',
      },
      {
        label: 'التقييمات',
        icon: 'MessageSquareHeart',
        path: '/admin/reviews',
        permission: 'reviews.read',
      },
      {
        label: 'العروض',
        icon: 'Tag',
        path: '/admin/offers',
        permission: 'offers.read',
      },
    ],
  },
  {
    title: 'المحتوى والعروض',
    items: [
      {
        label: 'شرائح البانر',
        icon: 'Image',
        path: '/admin/promos',
        permission: 'promos.read',
        children: [
          {
            label: 'الهيرو',
            icon: 'Star',
            path: '/admin/promos?placement=hero',
            permission: 'promos.read',
          },
          {
            label: 'شريط العروض',
            icon: 'Tag',
            path: '/admin/promos?placement=deals_strip',
            permission: 'promos.read',
          },
          {
            label: 'CTA الرئيسية',
            icon: 'MousePointerClick',
            path: '/admin/promos?placement=homepage_cta',
            permission: 'promos.read',
          },
          {
            label: 'بانرات الفئات',
            icon: 'FolderOpen',
            path: '/admin/promos?placement=category_banner',
            permission: 'promos.read',
          },
          {
            label: 'النوافذ المنبثقة',
            icon: 'Popup',
            path: '/admin/promos?placement=popup',
            permission: 'promos.read',
          },
          {
            label: 'بانر عروض النهارده',
            icon: 'Flame',
            path: '/admin/promos?placement=offers_banner',
            permission: 'promos.read',
          },
        ],
      },
      {
        label: 'مكتبة الوسائط',
        icon: 'GalleryHorizontal',
        path: '/admin/media',
        permission: 'media.read',
      },
      {
        label: 'استيراد المنتجات',
        icon: 'Upload',
        path: '/admin/products/import',
        permission: 'imports.read',
      },
      {
        label: 'رفع صور مجمع',
        icon: 'Images',
        path: '/admin/products/images/bulk',
        permission: 'products.write',
      },
      {
        label: 'استيراد PDF (موردين)',
        icon: 'FileText',
        path: '/admin/products/pdf-import',
        permission: 'imports.read',
      },
    ],
  },
  {
    title: 'العمليات',
    items: [
      {
        label: 'العملاء',
        icon: 'Users',
        path: '/admin/customers',
        permission: 'customers.read',
      },
      {
        label: 'التوصيل',
        icon: 'Truck',
        path: '/admin/delivery',
        permission: 'delivery.read',
        children: [
          {
            label: 'المناديب',
            icon: 'UserRound',
            path: '/admin/delivery/drivers',
            permission: 'delivery.read',
          },
          {
            label: 'مناطق التوصيل',
            icon: 'MapPin',
            path: '/admin/delivery/areas',
            permission: 'delivery.read',
          },
        ],
      },
      {
        label: 'الفروع',
        icon: 'Building2',
        path: '/admin/branches',
        permission: 'branches.read',
      },
      {
        label: 'الموظفين',
        icon: 'UserCog',
        path: '/admin/employees',
        permission: 'employees.read',
      },
    ],
  },
  {
    title: 'التقارير',
    items: [
      {
        label: 'التقارير',
        icon: 'BarChart3',
        path: '/admin/reports',
        permission: 'reports.read',
      },
    ],
  },
  {
    title: 'الإعدادات',
    items: [
      {
        label: 'الإعدادات',
        icon: 'Settings',
        path: '/admin/settings',
        permission: 'settings.read',
      },
      {
        label: 'إعدادات الموقع',
        icon: 'LayoutTemplate',
        path: '/admin/site-settings',
        permission: 'settings.read',
      },
    ],
  },
]

/** Bottom navigation items for mobile. */
export const MOBILE_NAV_ITEMS: {
  label: string
  icon: string
  path: string
  permission?: string
}[] = [
  { label: 'الرئيسية', icon: 'LayoutDashboard', path: '/admin', permission: 'dashboard.read' },
  { label: 'الطلبات', icon: 'ClipboardList', path: '/admin/orders', permission: 'orders.read' },
  { label: 'المنتجات', icon: 'Package', path: '/admin/products', permission: 'products.read' },
  { label: 'العملاء', icon: 'Users', path: '/admin/customers', permission: 'customers.read' },
  { label: 'الإعدادات', icon: 'Settings', path: '/admin/settings', permission: 'settings.read' },
]
