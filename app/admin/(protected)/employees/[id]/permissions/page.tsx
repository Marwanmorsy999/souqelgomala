import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { StaffPermissionsEditor } from '@/components/admin/staff-permissions-editor'

export const metadata: Metadata = {
  title: 'صلاحيات الموظف | لوحة التحكم | سوق الجملة',
  description: 'تعديل صلاحيات الوصول للموظف',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminEmployeePermissionsPage({ params }: PageProps) {
  const { id } = await params

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="صلاحيات الموظف"
        description="تحديد ما يمكن للموظف الوصول إليه وتعديله داخل لوحة التحكم"
      />
      <StaffPermissionsEditor staffId={id} />
    </div>
  )
}
