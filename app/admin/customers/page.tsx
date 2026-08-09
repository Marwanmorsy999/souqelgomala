import type { Metadata } from 'next'
import { Users } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/feedback/empty-state'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'العملاء | لوحة التحكم | سوق الجملة',
  description: 'إدارة عملاء المتجر',
}

/**
 * Customers module page.
 *
 * Milestone 2 scope is the application shell only — the customers
 * module (CRM, profiles, VIP/blacklist) arrives in a future
 * feature milestone.
 */
export default function AdminCustomersPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="العملاء"
        description="إدارة عملاء المتجر ومتابعة علاقاتهم"
      />

      <Card>
        <CardContent className="flex min-h-72 items-center justify-center p-8">
          <EmptyState
            icon={Users}
            title="وحدة العملاء قادمة قريباً"
            description="سيتم بناء إدارة العملاء وملفاتهم في مرحلة وحدة العملاء."
          />
        </CardContent>
      </Card>
    </div>
  )
}
