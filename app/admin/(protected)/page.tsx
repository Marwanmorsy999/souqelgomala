import type { Metadata } from 'next'
import { LayoutDashboard } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/feedback/empty-state'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'نظرة عامة | لوحة التحكم | سوق الجملة',
  description: 'ملخص أداء متجر سوق الجملة',
}

/**
 * Admin dashboard home.
 *
 * Milestone 2 scope is the application shell only — KPI cards, charts,
 * and widgets arrive in Milestone 4 (Dashboard Foundation).
 */
export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="نظرة عامة"
        description="إليك ملخص أداء متجرك"
      />

      <Card>
        <CardContent className="flex min-h-72 items-center justify-center p-8">
          <EmptyState
            icon={LayoutDashboard}
            title="لوحة المعلومات قادمة قريباً"
            description="ستظهر هنا مؤشرات الأداء والرسوم البيانية في مرحلة الأساس (Milestone 4)."
          />
        </CardContent>
      </Card>
    </div>
  )
}

