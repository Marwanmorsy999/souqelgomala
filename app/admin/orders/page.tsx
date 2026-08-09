import type { Metadata } from 'next'
import { ClipboardList } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/feedback/empty-state'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'الطلبات | لوحة التحكم | سوق الجملة',
  description: 'إدارة ومتابعة طلبات سوق الجملة',
}

/**
 * Orders module page.
 *
 * Milestone 2 scope is the application shell only — the orders module
 * (table, kanban, detail) arrives in a future feature milestone.
 */
export default function AdminOrdersPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="الطلبات"
        description="إدارة ومتابعة طلبات المتجر"
      />

      <Card>
        <CardContent className="flex min-h-72 items-center justify-center p-8">
          <EmptyState
            icon={ClipboardList}
            title="وحدة الطلبات قادمة قريباً"
            description="سيتم بناء جدول الطلبات ولوحة المتابعة في مرحلة وحدة الطلبات."
          />
        </CardContent>
      </Card>
    </div>
  )
}

