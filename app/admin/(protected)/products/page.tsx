import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { ProductsManagement } from '@/components/admin/products-management'

export const metadata: Metadata = {
  title: 'المنتجات | لوحة التحكم | سوق الجملة',
  description: 'إدارة منتجات متجر سوق الجملة',
}

export default function AdminProductsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="المنتجات"
        description="إدارة منتجات المتجر والمخزون"
      />
      <ProductsManagement />
    </div>
  )
}
