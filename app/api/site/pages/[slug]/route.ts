import { NextRequest } from 'next/server'
import { ok, notFound, serverError } from '@/services/api-response'
import { getStaticPageBySlug } from '@/services/site-structure-service'

export const dynamic = 'force-dynamic'

/**
 * Public static page by slug.
 *
 * GET /api/site/pages/:slug — returns the published page (404 if not published).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params
    const page = await getStaticPageBySlug(slug)
    if (!page || !page.published) {
      return notFound('الصفحة غير موجودة')
    }
    return ok({
      id: page.id,
      slug: page.slug,
      title: page.title,
      content: page.content,
      metaTitle: page.meta_title,
      metaDescription: page.meta_description,
    })
  } catch (err) {
    console.error('Static page error', err)
    return serverError('فشل تحميل الصفحة')
  }
}
