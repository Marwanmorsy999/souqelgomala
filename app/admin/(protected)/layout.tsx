import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { ShellProvider } from '@/components/layout/shell-context'
import { AppShell } from '@/components/layout/app-shell'
import { requireAuth } from '@/services/auth'

export const metadata: Metadata = {
  title: 'لوحة التحكم | سوق الجملة',
  description: 'لوحة تحكم إدارة سوق الجملة — الطلبات، المنتجات، العملاء، والتقارير',
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
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