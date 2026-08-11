import { NextRequest } from 'next/server'
import { ok, serverError } from '@/services/api-response'
import { listStaticPages } from '@/services/site-structure-service'

export const dynamic = 'force-dynamic'

/**
 * Public static pages list.
 *
 * GET /api/site/pages — published pages only (for the footer menu).
 */
export async function GET(_request: NextRequest) {
  try {
    const rows = await listStaticPages()
    const published = rows
      .filter((p) => p.published)
      .map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        metaTitle: p.meta_title,
        metaDescription: p.meta_description,
      }))
    return ok(published)
  } catch (err) {
    console.error('Static pages list error', err)
    return serverError('فشل تحميل الصفحات')
  }
}
