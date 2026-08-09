import type { Metadata } from 'next'
import { Tag } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/feedback/empty-state'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'العروض | لوحة التحكم | سوق الجملة',
  description: 'إدارة العروض والتخفيضات',
}

/**
 * Offers module page.
 *
 * Milestone 2 scope is the application shell only — the offers module
 * (CRUD, banner preview, discount types) arrives in a future
 * feature milestone.
 */
export default function AdminOffersPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="العروض"
        description="إدارة العروض والتخفيضات"
      />

      <Card>
        <CardContent className="flex min-h-72 items-center justify-center p-8">
          <EmptyState
            icon={Tag}
            title="وحدة العروض قادمة قريباً"
            description="سيتم بناء إدارة العروض وأنواع الخصومات في مرحلة وحدة العروض."
          />
        </CardContent>
      </Card>
    </div>
  )
}
