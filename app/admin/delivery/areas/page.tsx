import type { Metadata } from 'next'
import { MapPin } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/feedback/empty-state'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'مناطق التوصيل | لوحة التحكم | سوق الجملة',
  description: 'إدارة مناطق التوصيل',
}

/**
 * Delivery areas page.
 *
 * Milestone 2 scope is the application shell only — area
 * management (CRUD, fees) arrives in a future feature milestone.
 */
export default function AdminDeliveryAreasPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="مناطق التوصيل"
        description="إدارة مناطق التوصيل ورسومها"
      />

      <Card>
        <CardContent className="flex min-h-72 items-center justify-center p-8">
          <EmptyState
            icon={MapPin}
            title="إدارة مناطق التوصيل قادمة قريباً"
            description="سيتم بناء إدارة مناطق التوصيل ورسومها في مرحلة وحدة التوصيل."
          />
        </CardContent>
      </Card>
    </div>
  )
}
