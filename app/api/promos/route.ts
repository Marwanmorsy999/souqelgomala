import { NextRequest } from 'next/server'
import { getActivePromos } from '@/services/catalog/admin-promos-service'
import { ok, serverError } from '@/services/api-response'
import type { PromoPlacement } from '@/db/schema/promos'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const placement = request.nextUrl.searchParams.get('placement') as
      | PromoPlacement
      | undefined
    const rows = await getActivePromos({ placement })
    return ok(rows)
  } catch (err) {
    return serverError((err as Error).message ?? 'فشل تحميل المحتوى')
  }
}
