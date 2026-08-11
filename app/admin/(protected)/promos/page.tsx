import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { PromoSlotEditor } from '@/components/admin/promo-slot-editor'

export const metadata: Metadata = {
  title: 'المحتوى والعروض | لوحة التحكم | سوق الجملة',
  description: 'إدارة بانرات الصفحة الرئيسية والعروض',
}

export default function AdminPromosPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="المحتوى والعروض"
        description="إدارة شرائح البانر، شريط العروض، ونوافذ CTA"
      />
      <PromoSlotEditor placement="hero" title="الهيرو" />
      <PromoSlotEditor placement="deals_strip" title="شريط العروض" />
      <PromoSlotEditor placement="homepage_cta" title="كتابة CTA الرئيسية" />
      <PromoSlotEditor placement="category_banner" title="بانرات الفئات" />
      <PromoSlotEditor placement="popup" title="النوافذ المنبثقة" />
      <PromoSlotEditor placement="offers_banner" title="بانر عروض النهارده" />
    </div>
  )
}
