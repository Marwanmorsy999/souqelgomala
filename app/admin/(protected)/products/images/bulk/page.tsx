import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { ProductImageBulkUpload } from '@/components/admin/product-image-bulk-upload'

export const metadata: Metadata = {
  title: 'رفع صور مجمع | لوحة التحكم | سوق الجملة',
  description: 'رفع مجموعة صور وربطها بالمنتجات',
}

export default function AdminProductImagesBulkPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="رفع صور مجمع"
        description="ارفع عدة صور معاً وسنقترح مطابقتها مع المنتجات"
      />
      <ProductImageBulkUpload />
    </div>
  )
}
