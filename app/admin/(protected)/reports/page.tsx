import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { ReportsView } from '@/components/admin/reports-view'

export const metadata: Metadata = {
  title: 'التقارير | لوحة التحكم | سوق الجملة',
  description: 'تقارير وتحليلات المبيعات والأداء',
}

/**
 * Reports module — basic insights (revenue, orders, top products,
 * low-stock watchlist) with one-click Excel/CSV exports.
 */
export default function AdminReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="التقارير"
        description="رؤى سريعة عن المبيعات والمنتجات مع تصدير Excel"
      />
      <ReportsView />
    </div>
  )
}
