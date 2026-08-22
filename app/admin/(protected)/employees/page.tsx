import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { EmployeesManagement } from '@/components/admin/employees-management'
import { requireAuth } from '@/services/auth'

export const metadata: Metadata = {
  title: 'الموظفين | لوحة التحكم | سوق الجملة',
  description: 'إدارة موظفي المتجر وصلاحياتهم',
}

export default async function AdminEmployeesPage() {
  const user = await requireAuth()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="الموظفين"
        description="إدارة حسابات الموظفين وأدوارهم وتفعيل أو إيقاف حساباتهم"
      />
      <EmployeesManagement actorId={user.id} actorRole={user.role} />
    </div>
  )
}
