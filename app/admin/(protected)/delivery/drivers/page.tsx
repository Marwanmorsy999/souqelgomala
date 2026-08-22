import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { DriversManagement } from '@/components/admin/delivery/drivers-management'

export const metadata: Metadata = {
  title: 'المناديب | لوحة التحكم | سوق الجملة',
  description: 'إدارة مناديب التوصيل',
}

export default function AdminDeliveryDriversPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="المناديب"
        description="إضافة وتعديل مناديب التوصيل ومتابعة حالتهم وطلباتهم"
      />
      <DriversManagement />
    </div>
  )
}
