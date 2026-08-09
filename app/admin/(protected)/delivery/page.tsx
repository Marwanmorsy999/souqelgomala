import type { Metadata } from 'next'
import { Truck } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/feedback/empty-state'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'التوصيل | لوحة التحكم | سوق الجملة',
  description: 'إدارة التوصيل والمناديب',
}

/**
 * Delivery module page.
 *
 * Milestone 2 scope is the application shell only — the delivery
 * module (drivers, areas, assignments) arrives in a future
 * feature milestone.
 */
export default function AdminDeliveryPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="التوصيل"
        description="إدارة التوصيل والمناديب ومناطق التوصيل"
      />

      <Card>
        <CardContent className="flex min-h-72 items-center justify-center p-8">
          <EmptyState
            icon={Truck}
            title="وحدة التوصيل قادمة قريباً"
            description="سيتم بناء إدارة المناديب ومناطق التوصيل في مرحلة وحدة التوصيل."
          />
        </CardContent>
      </Card>
    </div>
  )
}
