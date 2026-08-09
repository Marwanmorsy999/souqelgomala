'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { hasPermission } from '@/lib/permissions'
import type { FeatureFlagKey } from '@/lib/constants'
import { FEATURE_FLAG_KEYS } from '@/lib/constants'
import type { Role } from '@/types/database'

/**
 * Shell UI state + access mocks.
 *
 * This milestone is UI-first: there is NO authentication yet. We expose
 * safe defaults (role = owner, all core flags enabled) so the shell
 * renders fully. When auth/RBAC lands (Milestone 3), this provider is
 * replaced by the real auth context without changing shell components.
 */

const ENABLED_FLAGS: Record<FeatureFlagKey, boolean> = {
  [FEATURE_FLAG_KEYS.WISHLIST]: false,
  [FEATURE_FLAG_KEYS.REVIEWS]: false,
  [FEATURE_FLAG_KEYS.LOYALTY]: false,
  [FEATURE_FLAG_KEYS.COUPONS]: false,
  [FEATURE_FLAG_KEYS.INVENTORY]: true,
  [FEATURE_FLAG_KEYS.SUPPLIERS]: true,
  [FEATURE_FLAG_KEYS.PURCHASE_ORDERS]: true,
  [FEATURE_FLAG_KEYS.RETURNS]: true,
  [FEATURE_FLAG_KEYS.AI_ASSISTANT]: false,
}

interface ShellContextValue {
  // Shell UI state
  sidebarCollapsed: boolean
  mobileSidebarOpen: boolean
  toggleSidebarCollapsed: () => void
  openMobileSidebar: () => void
  closeMobileSidebar: () => void

  // Access mocks (replaced by real auth in Milestone 3)
  role: Role
  can: (permission: string) => boolean
  isFlagEnabled: (flag: FeatureFlagKey) => boolean

  // Extension points (placeholders wired here)
  searchOpen: boolean
  openSearch: () => void
  closeSearch: () => void
}

const ShellContext = createContext<ShellContextValue | null>(null)

export function ShellProvider({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const toggleSidebarCollapsed = useCallback(
    () => setSidebarCollapsed((value) => !value),
    []
  )
  const openMobileSidebar = useCallback(() => setMobileSidebarOpen(true), [])
  const closeMobileSidebar = useCallback(() => setMobileSidebarOpen(false), [])

  const can = useCallback(
    (permission: string) => hasPermission('owner', permission),
    []
  )
  const isFlagEnabled = useCallback(
    (flag: FeatureFlagKey) => ENABLED_FLAGS[flag] ?? false,
    []
  )

  const openSearch = useCallback(() => setSearchOpen(true), [])
  const closeSearch = useCallback(() => setSearchOpen(false), [])

  const value = useMemo<ShellContextValue>(
    () => ({
      sidebarCollapsed,
      mobileSidebarOpen,
      toggleSidebarCollapsed,
      openMobileSidebar,
      closeMobileSidebar,
      role: 'owner',
      can,
      isFlagEnabled,
      searchOpen,
      openSearch,
      closeSearch,
    }),
    [
      sidebarCollapsed,
      mobileSidebarOpen,
      toggleSidebarCollapsed,
      openMobileSidebar,
      closeMobileSidebar,
      can,
      isFlagEnabled,
      searchOpen,
      openSearch,
      closeSearch,
    ]
  )

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>
}

export function useShell(): ShellContextValue {
  const context = useContext(ShellContext)
  if (!context) {
    throw new Error('useShell must be used within a ShellProvider')
  }
  return context
}

