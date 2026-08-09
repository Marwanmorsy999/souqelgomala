'use client'

import type { ReactNode } from 'react'
import { Bell, Menu, Search, UserRound, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { useShell } from './shell-context'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

interface UserInfo {
  id: string
  email: string
  fullName: string
  role: string
  avatar?: string | null
}

interface TopbarProps {
  user?: UserInfo | null
  /** Extension slot: global search trigger (command palette). */
  searchTrigger?: ReactNode
  /** Extension slot: notifications trigger/dropdown. */
  notifications?: ReactNode
  /** Extension slot: branch selector. */
  branchSelector?: ReactNode
  /** Extension slot: realtime/connection status. */
  realtimeStatus?: ReactNode
  /** Extension slot: user menu. */
  userMenu?: ReactNode
  className?: string
}

/**
 * Admin topbar. Renders the mobile menu trigger, page-level extension
 * slots, theme toggle, and a default user chip. Slots default to
 * placeholder triggers until the respective milestones land.
 */
export function Topbar({
  user: userProp,
  searchTrigger,
  notifications,
  branchSelector,
  realtimeStatus,
  userMenu,
  className,
}: TopbarProps) {
  const { openMobileSidebar, openSearch } = useShell()
  const { user: authUser, logout } = useAuth()
  const user = userProp || authUser

  const displayName = user?.fullName || 'المدير'
  const displayEmail = user?.email || ''

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur',
        'md:px-6',
        className
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={openMobileSidebar}
        aria-label="فتح القائمة"
      >
        <Menu className="size-5" />
      </Button>

      {/* Search trigger — defaults to a ghost button wired to shell state */}
      {searchTrigger ?? (
        <Button
          variant="ghost"
          size="sm"
          className="hidden h-8 gap-2 rounded-lg text-muted-foreground sm:flex"
          onClick={openSearch}
          aria-label="بحث عام"
        >
          <Search className="size-4" />
          <span>بحث…</span>
        </Button>
      )}

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        {realtimeStatus}
        {branchSelector}
        {notifications ?? (
          <Button variant="ghost" size="icon" aria-label="الإشعارات">
            <Bell className="size-5" />
          </Button>
        )}
        <ThemeToggle />
      </div>

      {userMenu ?? (
        <div className="flex items-center gap-2">
          <div className="hidden text-right md:block">
            <p className="text-sm font-medium">{displayName}</p>
            {displayEmail && (
              <p className="text-xs text-muted-foreground">{displayEmail}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="flex gap-2 px-2"
            aria-label="حساب المستخدم"
            onClick={logout}
            title="تسجيل الخروج"
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserRound className="size-4" />
            </span>
            <LogOut className="size-4 hidden md:block" />
          </Button>
        </div>
      )}
    </header>
  )
}


