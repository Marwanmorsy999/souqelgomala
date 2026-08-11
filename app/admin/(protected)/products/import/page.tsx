import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { ProductImportPage } from '@/components/admin/product-import-page'

export const metadata: Metadata = {
  title: 'استيراد المنتجات | لوحة التحكم | سوق الجملة',
  description: 'استيراد منتجات من Excel أو CSV',
}

export default function AdminProductsImportPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="استيراد المنتجات"
        description="تحميل نموذج، التحقق من البيانات، ثم تأكيد الاستيراد"
      />
      <ProductImportPage />
    </div>
  )
}
