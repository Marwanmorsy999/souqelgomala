import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { OrdersManagement } from '@/components/admin/orders-management'

export const metadata: Metadata = {
  title: 'الطلبات | لوحة التحكم | سوق الجملة',
  description: 'إدارة ومتابعة طلبات سوق الجملة',
}

export default function AdminOrdersPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="الطلبات"
        description="إدارة ومتابعة طلبات المتجر"
      />
      <OrdersManagement />
    </div>
  )
}
