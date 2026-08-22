import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { AreasManagement } from '@/components/admin/delivery/areas-management'

export const metadata: Metadata = {
  title: 'مناطق التوصيل | لوحة التحكم | سوق الجملة',
  description: 'إدارة مناطق التوصيل ورسومها',
}

export default function AdminDeliveryAreasPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="مناطق التوصيل"
        description="خريطة المناطق المدعومة مع رسوم التوصيل والحد الأدنى لكل منطقة"
      />
      <AreasManagement />
    </div>
  )
}
