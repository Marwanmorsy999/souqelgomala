import type { Metadata } from 'next'
import { SiteSettingsPage } from '@/components/admin/site-settings-page'

export const metadata: Metadata = {
  title: 'إعدادات الموقع | لوحة التحكم | سوق الجملة',
  description: 'إدارة بنية الموقع والإعدادات العامة والتنقل والصفحات وSEO',
}

export default function AdminSiteSettingsPage() {
  return <SiteSettingsPage />
}
