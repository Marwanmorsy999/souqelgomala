import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { PdfImportPage } from '@/components/admin/pdf-import-page'

export const metadata: Metadata = {
  title: 'استيراد PDF | لوحة التحكم | سوق الجملة',
  description: 'استيراد قوائم أسعار الموردين كمنتجات مسودة',
}

export default function AdminPdfImportPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="استيراد PDF (موردين)"
        description="ارفع قائمة أسعار PDF لإنشاء منتجات مسودة تلقائياً"
      />
      <PdfImportPage />
    </div>
  )
}
