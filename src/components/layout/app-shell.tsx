import type { ReactNode } from 'react'
import { AppSidebar } from './app-sidebar'
import { Topbar } from './topbar'
import { cn } from '@/lib/utils'

interface UserInfo {
  id: string
  email: string
  fullName: string
  role: string
  avatar?: string | null
}

interface AppShellProps {
  children: ReactNode
  user?: UserInfo | null
  /** Extension slot: global search trigger (passed to Topbar). */
  searchTrigger?: ReactNode
  /** Extension slot: notifications trigger/dropdown (passed to Topbar). */
  notifications?: ReactNode
  /** Extension slot: branch selector (passed to Topbar). */
  branchSelector?: ReactNode
  /** Extension slot: realtime/connection status (passed to Topbar). */
  realtimeStatus?: ReactNode
  /** Extension slot: user menu (passed to Topbar). */
  userMenu?: ReactNode
  className?: string
}

/**
 * Application shell — composes the sidebar + topbar + content area.
 *
 * - Server-component friendly: all interactive children are client
 *   components passed as children/slots.
 * - Content area is a scroll container; each page provides its own
 *   max-width + padding via PageHeader/page wrappers.
 */
export function AppShell({
  children,
  user,
  searchTrigger,
  notifications,
  branchSelector,
  realtimeStatus,
  userMenu,
  className,
}: AppShellProps) {
  return (
    <div dir="rtl" className={cn('flex min-h-dvh bg-background text-foreground', className)}>
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          user={user}
          searchTrigger={searchTrigger}
          notifications={notifications}
          branchSelector={branchSelector}
          realtimeStatus={realtimeStatus}
          userMenu={userMenu}
        />
        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}


