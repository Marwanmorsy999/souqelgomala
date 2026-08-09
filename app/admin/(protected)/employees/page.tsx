import type { Metadata } from 'next'
import { UserCog } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/feedback/empty-state'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'الموظفين | لوحة التحكم | سوق الجملة',
  description: 'إدارة موظفي المتجر',
}

/**
 * Employees module page.
 *
 * Milestone 2 scope is the application shell only — the employees
 * module (CRUD, role assignment) arrives in a future feature milestone.
 */
export default function AdminEmployeesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="الموظفين"
        description="إدارة موظفي المتجر وتحديد صلاحياتهم"
      />

      <Card>
        <CardContent className="flex min-h-72 items-center justify-center p-8">
          <EmptyState
            icon={UserCog}
            title="وحدة الموظفين قادمة قريباً"
            description="سيتم بناء إدارة الموظفين وتحديد أدوارهم في مرحلة وحدة الموظفين."
          />
        </CardContent>
      </Card>
    </div>
  )
}
