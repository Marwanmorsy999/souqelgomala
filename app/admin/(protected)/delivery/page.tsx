import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { DeliveryHub } from '@/components/admin/delivery/delivery-hub'

export const metadata: Metadata = {
  title: 'التوصيل | لوحة التحكم | سوق الجملة',
  description: 'إدارة التوصيل والمناديب',
}

/**
 * Delivery module hub — live summary + quick links to the
 * couriers and delivery zones management views.
 */
export default function AdminDeliveryPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="التوصيل"
        description="إدارة التوصيل والمناديب ومناطق التوصيل"
      />
      <DeliveryHub />
    </div>
  )
}
