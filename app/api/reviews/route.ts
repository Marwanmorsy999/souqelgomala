import { NextRequest } from 'next/server'
import { listApprovedReviews, submitReview } from '@/services/reviews'
import { ok, validationError, serverError } from '@/services/api-response'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await listApprovedReviews()
    return ok(data)
  } catch (err) {
    return serverError((err as Error).message ?? 'فشل تحميل التقييمات')
  }
}

const MAX = 1000

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return validationError({ body: ['Invalid JSON body'] })
  }

  const b = body as Record<string, unknown>
  const authorName = typeof b.authorName === 'string' ? b.authorName.trim() : ''
  const text = typeof b.text === 'string' ? b.text.trim() : ''
  const ratingRaw = Number(b.rating)
  const rating = Number.isFinite(ratingRaw) ? ratingRaw : 5

  if (!authorName || authorName.length < 2) {
    return validationError({ authorName: ['الاسم مطلوب (حرفين على الأقل)'] })
  }
  if (!text || text.length < 5) {
    return validationError({ text: ['اكتب رأيك (٥ أحرف على الأقل)'] })
  }

  try {
    const row = await submitReview({
      authorName: authorName.slice(0, 80),
      authorRole: typeof b.authorRole === 'string' ? b.authorRole.slice(0, 80) : undefined,
      rating,
      text: text.slice(0, MAX),
    })
    return ok({ id: row.id, status: row.status }, 201)
  } catch (err) {
    return serverError((err as Error).message ?? 'تعذر إرسال التقييم')
  }
}
