import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { MediaLibraryPage } from '@/components/admin/media-library-page'

export const metadata: Metadata = {
  title: 'مكتبة الوسائط | لوحة التحكم | سوق الجملة',
  description: 'إدارة صور ومقاطع المتجر',
}

export default function AdminMediaPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="مكتبة الوسائط"
        description="رفع، بحث، وحذف صور المتجر"
      />
      <MediaLibraryPage />
    </div>
  )
}
