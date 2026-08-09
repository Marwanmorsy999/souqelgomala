/**
 * Breadcrumb derivation
 *
 * Builds a breadcrumb trail from the current pathname using the sidebar
 * navigation tree (src/config/sidebar.ts). Unknown routes fall back to
 * the dashboard label.
 */

import { SIDEBAR_SECTIONS, type SidebarItem } from '@/config/sidebar'

export interface BreadcrumbItem {
  label: string
  href: string
  current: boolean
}

interface SidebarNode extends SidebarItem {
  parent?: SidebarNode
}

function flattenWithParent(items: SidebarItem[], parent?: SidebarNode): SidebarNode[] {
  return items.flatMap((item) => {
    const node: SidebarNode = { ...item, parent }
    return [node, ...(item.children ? flattenWithParent(item.children, node) : [])]
  })
}

export function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const normalized = pathname.replace(/\/+$/, '') || '/'

  const nodes = flattenWithParent(SIDEBAR_SECTIONS.flatMap((section) => section.items))
  // Longest-matching sidebar item (prefix match) wins.
  const sorted = [...nodes].sort((a, b) => b.path.length - a.path.length)
  const match = sorted.find(
    (node) => normalized === node.path || normalized.startsWith(`${node.path}/`)
  )

  const crumbs: BreadcrumbItem[] = []

  if (match) {
    // Rebuild the parent chain so nested routes show the full trail.
    const chain: SidebarNode[] = []
    let node: SidebarNode | undefined = match
    while (node) {
      chain.unshift(node)
      node = node.parent
    }
    chain.forEach((node, index) => {
      const isLast = index === chain.length - 1
      crumbs.push({
        label: node.label,
        href: node.path,
        current: isLast && normalized === node.path,
      })
    })
  } else {
    crumbs.push({ label: 'نظرة عامة', href: '/admin', current: true })
  }

  // Always start from the dashboard home when not already there.
  if (crumbs[0]?.href !== '/admin') {
    crumbs.unshift({ label: 'الرئيسية', href: '/admin', current: false })
  }

  return crumbs
}

