import type { Metadata } from 'next'
import { BarChart3 } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/feedback/empty-state'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'التقارير | لوحة التحكم | سوق الجملة',
  description: 'تقارير وتحليلات المبيعات',
}

/**
 * Reports module page.
 *
 * Milestone 2 scope is the application shell only — the reports
 * module (analytics, charts, export) arrives in a future feature milestone.
 */
export default function AdminReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="التقارير"
        description="تقارير وتحليلات المبيعات والأداء"
      />

      <Card>
        <CardContent className="flex min-h-72 items-center justify-center p-8">
          <EmptyState
            icon={BarChart3}
            title="وحدة التقارير قادمة قريباً"
            description="سيتم بناء التقارير والتحليلات في مرحلة وحدة التقارير."
          />
        </CardContent>
      </Card>
    </div>
  )
}
