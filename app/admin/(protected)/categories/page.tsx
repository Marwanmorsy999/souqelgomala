import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { CategoriesManagement } from '@/components/admin/categories-management'

export const metadata: Metadata = {
  title: 'الفئات | لوحة التحكم | سوق الجملة',
  description: 'إدارة فئات المنتجات',
}

export default function AdminCategoriesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="الفئات"
        description="إدارة فئات وأقسام المنتجات"
      />
      <CategoriesManagement />
    </div>
  )
}
