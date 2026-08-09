import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { ShellProvider } from '@/components/layout/shell-context'
import { AppShell } from '@/components/layout/app-shell'
import { requireAuth, requireRole } from '@/services/auth'

export const metadata: Metadata = {
  title: 'لوحة التحكم | سوق الجملة',
  description: 'لوحة تحكم إدارة سوق الجملة — الطلبات، المنتجات، العملاء، والتقارير',
}

/**
 * Admin application shell layout.
 *
 * Server component: wraps protected admin routes with auth guards.
 * Content pages remain server components by default.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Auth guard — redirects to login if not authenticated
  const user = await requireAuth()

  return (
    <ShellProvider>
      <AppShell 
        user={{
          id: user.id,
          email: user.email || '',
          fullName: user.full_name,
          role: user.role,
          avatar: user.avatar,
        }}
      >
        {children}
      </AppShell>
    </ShellProvider>
  )
}


