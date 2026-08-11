import type { Metadata } from 'next'
import { CategoryManager } from '@/components/admin/site-settings-categories'

export const metadata: Metadata = {
  title: 'الفئات | لوحة التحكم | سوق الجملة',
  description: 'إدارة فئات وأقسام المنتجات (إنشاء وتعديل وحذف مع فحص التبعيات)',
}

export default function AdminCategoriesPage() {
  return (
    <div className="flex flex-col gap-6">
      <CategoryManager />
    </div>
  )
}
