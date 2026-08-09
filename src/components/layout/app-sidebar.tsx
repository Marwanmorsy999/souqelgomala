'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react'
import { createElement, useCallback, useEffect, useState } from 'react'
import { SIDEBAR_SECTIONS, type SidebarItem } from '@/config/sidebar'
import { getNavIcon } from './icon-map'
import { useShell } from './shell-context'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

interface AppSidebarProps {
  className?: string
}

/**
 * Main admin sidebar.
 *
 * - RTL-first (renders on the right edge)
 * - Desktop: collapsible to icon-only (width 72px)
 * - Mobile: slide-in drawer with overlay
 * - Nested sections with expandable children
 * - Permission + feature-flag aware (via shell context)
 * - Keyboard navigation (navigate via links)
 */
export function AppSidebar({ className }: AppSidebarProps) {
  const pathname = usePathname()
  const {
    sidebarCollapsed,
    mobileSidebarOpen,
    toggleSidebarCollapsed,
    closeMobileSidebar,
    can,
    isFlagEnabled,
  } = useShell()

  const [expanded, setExpanded] = useState<string | null>(() => {
    // Auto-expand the section that contains the active route.
    const active = SIDEBAR_SECTIONS.flatMap((section) => section.items).find((item) =>
      item.children?.some((child) => pathname.startsWith(child.path))
    )
    return active?.path ?? null
  })

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileSidebarOpen])

  const toggleExpand = useCallback((path: string) => {
    setExpanded((current) => (current === path ? null : path))
  }, [])

  const isActive = useCallback(
    (path: string) => pathname === path || pathname.startsWith(`${path}/`),
    [pathname]
  )

  const visibleSections = SIDEBAR_SECTIONS.filter((section) =>
    section.items.some(
      (item) =>
        (!item.permission || can(item.permission)) &&
        (!item.featureFlag || isFlagEnabled(item.featureFlag))
    )
  )

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={closeMobileSidebar}
            aria-hidden
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex flex-col border-l bg-sidebar transition-[width] duration-200 ease-out',
          'md:relative md:z-0',
          sidebarCollapsed ? 'md:w-[72px]' : 'md:w-[260px]',
          mobileSidebarOpen ? 'w-[280px] shadow-2xl' : 'w-[280px] -right-full md:right-auto',
          className
        )}
        aria-label="القائمة الجانبية"
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between gap-2 px-4">
          <Link
            href="/admin"
            className="flex min-w-0 items-center gap-2.5 overflow-hidden"
            onClick={closeMobileSidebar}
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-black text-primary-foreground">
              SG
            </div>
            <div className={cn('min-w-0', sidebarCollapsed && 'md:hidden')}>
              <p className="truncate text-sm font-black">سوق الجملة</p>
              <p className="truncate text-[10px] text-muted-foreground">لوحة الإدارة</p>
            </div>
          </Link>
          <button
            type="button"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
            onClick={closeMobileSidebar}
            aria-label="إغلاق القائمة"
          >
            <X className="size-5" />
          </button>
        </div>

        <Separator className="mb-3" />

        {/* Nav */}
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
          {visibleSections.map((section) => (
            <div key={section.title ?? 'default'}>
              {section.title ? (
                <p
                  className={cn(
                    'px-2 pb-1.5 text-[10px] font-bold tracking-wide text-muted-foreground uppercase',
                    sidebarCollapsed && 'md:hidden'
                  )}
                >
                  {section.title}
                </p>
              ) : null}
              <ul className="space-y-0.5">
                {section.items
                  .filter(
                    (item) =>
                      (!item.permission || can(item.permission)) &&
                      (!item.featureFlag || isFlagEnabled(item.featureFlag))
                  )
                  .map((item) => (
                    <SidebarLink
                      key={item.path}
                      item={item}
                      collapsed={sidebarCollapsed}
                      isActive={isActive}
                      expanded={expanded === item.path}
                      onToggleExpand={() => toggleExpand(item.path)}
                      onNavigate={closeMobileSidebar}
                    />
                  ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer / collapse toggle */}
        <div className="border-t p-3">
          <button
            type="button"
            onClick={toggleSidebarCollapsed}
            className="hidden w-full items-center justify-center gap-2 rounded-lg p-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:flex"
            aria-label={sidebarCollapsed ? 'توسيع القائمة' : 'طي القائمة'}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <>
                <PanelLeftClose className="size-4" />
                <span>طي القائمة</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  )
}

interface SidebarLinkProps {
  item: SidebarItem
  collapsed: boolean
  isActive: (path: string) => boolean
  expanded: boolean
  onToggleExpand: () => void
  onNavigate: () => void
}

function SidebarLink({
  item,
  collapsed,
  isActive,
  expanded,
  onToggleExpand,
  onNavigate,
}: SidebarLinkProps) {
  const Icon = getNavIcon(item.icon)
  const active = isActive(item.path)
  const hasChildren = Boolean(item.children?.length)
  const visibleChildren = (item.children ?? []).filter((child) => child)

  const buttonClass = cn(
    'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
    active
      ? 'bg-primary/10 text-primary'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
    collapsed && 'md:justify-center md:px-0'
  )

  const label = <span className={cn('min-w-0 flex-1 truncate text-right', collapsed && 'md:hidden')}>{item.label}</span>

  if (hasChildren) {
    return (
      <li>
        <button type="button" className={buttonClass} onClick={onToggleExpand} aria-expanded={expanded}>
          {createElement(Icon, { className: 'size-4.5 shrink-0' })}
          {label}
          <ChevronDown
            className={cn(
              'size-3.5 shrink-0 text-muted-foreground transition-transform',
              expanded && 'rotate-180',
              collapsed && 'md:hidden'
            )}
          />
        </button>
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.ul
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
              className={cn('overflow-hidden', collapsed && 'md:hidden')}
            >
              {visibleChildren.map((child) => (
                <li key={child.path}>
                  <Link
                    href={child.path}
                    onClick={onNavigate}
                    className={cn(
                      'mr-4 flex items-center gap-2.5 border-r pr-3 py-2 text-sm font-medium transition-colors',
                      isActive(child.path)
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span className="size-1 rounded-full bg-current opacity-60" />
                    {child.label}
                  </Link>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </li>
    )
  }

  return (
    <li>
      <Link
        href={item.path}
        onClick={onNavigate}
        className={cn(buttonClass, active && 'shadow-sm')}
        aria-current={active ? 'page' : undefined}
      >
        {createElement(Icon, { className: 'size-4.5 shrink-0' })}
        {label}
      </Link>
    </li>
  )
}

