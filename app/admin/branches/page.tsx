import type { Metadata } from 'next'
import { Building2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/feedback/empty-state'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'الفروع | لوحة التحكم | سوق الجملة',
  description: 'إدارة فروع المتجر',
}

/**
 * Branches module page.
 *
 * Milestone 2 scope is the application shell only — the branches
 * module (CRUD, map integration) arrives in a future feature milestone.
 */
export default function AdminBranchesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="الفروع"
        description="إدارة فروع المتجر"
      />

      <Card>
        <CardContent className="flex min-h-72 items-center justify-center p-8">
          <EmptyState
            icon={Building2}
            title="وحدة الفروع قادمة قريباً"
            description="سيتم بناء إدارة الفروع في مرحلة وحدة الفروع."
          />
        </CardContent>
      </Card>
    </div>
  )
}
