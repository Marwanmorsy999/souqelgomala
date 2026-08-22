import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { BranchesManagement } from '@/components/admin/branches-management'

export const metadata: Metadata = {
  title: 'الفروع | لوحة التحكم | سوق الجملة',
  description: 'إدارة فروع المتجر',
}

export default function AdminBranchesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="الفروع"
        description="إدارة فروع المتجر وعناوينها وأرقامها"
      />
      <BranchesManagement />
    </div>
  )
}
