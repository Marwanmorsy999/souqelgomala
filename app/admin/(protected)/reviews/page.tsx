import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { ReviewsModeration } from '@/components/admin/reviews-moderation'

export const metadata: Metadata = {
  title: 'التقييمات | لوحة التحكم | سوق الجملة',
  description: 'مراجعة وإدارة تقييمات العملاء',
}

export default function AdminReviewsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="التقييمات"
        description="مراجعة تقييمات العملاء قبل نشرها — لا تُنشر بيانات تجريبية"
      />
      <ReviewsModeration />
    </div>
  )
}
