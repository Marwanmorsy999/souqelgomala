import type { Metadata } from 'next'
import { FolderTree } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/feedback/empty-state'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'الفئات | لوحة التحكم | سوق الجملة',
  description: 'إدارة فئات المنتجات',
}

/**
 * Categories module page.
 *
 * Milestone 2 scope is the application shell only — the categories
 * module (nested CRUD, drag-and-drop sort) arrives in a future
 * feature milestone.
 */
export default function AdminCategoriesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="الفئات"
        description="إدارة فئات وأقسام المنتجات"
      />

      <Card>
        <CardContent className="flex min-h-72 items-center justify-center p-8">
          <EmptyState
            icon={FolderTree}
            title="وحدة الفئات قادمة قريباً"
            description="سيتم بناء إدارة الفئات المتداخلة في مرحلة وحدة الفئات."
          />
        </CardContent>
      </Card>
    </div>
  )
}
