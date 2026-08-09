import type { Metadata } from 'next'
import { Settings } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/feedback/empty-state'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'الإعدادات | لوحة التحكم | سوق الجملة',
  description: 'إعدادات المتجر',
}

/**
 * Settings module page.
 *
 * Milestone 2 scope is the application shell only — the settings
 * module (store info, invoice, taxes) arrives in a future feature milestone.
 */
export default function AdminSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="الإعدادات"
        description="إعدادات المتجر والفاتورة"
      />

      <Card>
        <CardContent className="flex min-h-72 items-center justify-center p-8">
          <EmptyState
            icon={Settings}
            title="وحدة الإعدادات قادمة قريباً"
            description="سيتم بناء إعدادات المتجر والتفضيلات في مرحلة وحدة الإعدادات."
          />
        </CardContent>
      </Card>
    </div>
  )
}
