import type { Metadata } from 'next'
import { UserRound } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/feedback/empty-state'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'المناديب | لوحة التحكم | سوق الجملة',
  description: 'إدارة مناديب التوصيل',
}

/**
 * Delivery drivers page.
 *
 * Milestone 2 scope is the application shell only — driver
 * management (CRUD, assignment) arrives in a future feature milestone.
 */
export default function AdminDeliveryDriversPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="المناديب"
        description="إدارة مناديب التوصيل"
      />

      <Card>
        <CardContent className="flex min-h-72 items-center justify-center p-8">
          <EmptyState
            icon={UserRound}
            title="إدارة المناديب قادمة قريباً"
            description="سيتم بناء إدارة المناديب وتكليفهم بالطلبات في مرحلة وحدة التوصيل."
          />
        </CardContent>
      </Card>
    </div>
  )
}
