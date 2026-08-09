import type { Metadata } from 'next'
import { Package } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/feedback/empty-state'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'المنتجات | لوحة التحكم | سوق الجملة',
  description: 'إدارة منتجات متجر سوق الجملة',
}

/**
 * Products module page.
 *
 * Milestone 2 scope is the application shell only — the products module
 * (table, form, bulk actions) arrives in a future feature milestone.
 */
export default function AdminProductsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="المنتجات"
        description="إدارة منتجات المتجر والمخزون"
      />

      <Card>
        <CardContent className="flex min-h-72 items-center justify-center p-8">
          <EmptyState
            icon={Package}
            title="وحدة المنتجات قادمة قريباً"
            description="سيتم بناء جدول المنتجات ونموذج الإضافة في مرحلة وحدة المنتجات."
          />
        </CardContent>
      </Card>
    </div>
  )
}

