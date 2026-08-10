import { NextRequest } from 'next/server'
import { ok, serverError } from '@/services/api-response'
import { getSiteSettings } from '@/services/settings'

export const dynamic = 'force-dynamic'

/**
 * Public site-info endpoint.
 *
 * GET /api/site
 *
 * Returns the merged business settings (D1 `settings` row over the
 * lib/site.ts defaults) so the storefront renders admin-managed business
 * info without code changes. KV cached by the settings service.
 */
export async function GET(_request: NextRequest) {
  try {
    const settings = await getSiteSettings()
    return ok(settings)
  } catch (err) {
    console.error('Site settings error', err)
    return serverError('فشل تحميل بيانات المتجر')
  }
}