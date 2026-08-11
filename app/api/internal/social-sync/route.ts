import { NextRequest, NextResponse } from 'next/server'
import { syncAllSocial } from '@/services/social-sync'
import { env } from '@/lib/env'

export const dynamic = 'force-dynamic'

/**
 * Internal cron-triggered social feed sync.
 *
 * POST /api/internal/social-sync — invoked by the Worker `scheduled` handler
 * (see worker.js) every 30 minutes. Authenticated by the shared CRON_SECRET
 * header so only the Worker can trigger it. Runs the Meta Graph + TikTok
 * Display syncs (no-op per platform when credentials are absent) and upserts
 * the results into D1. Never throws to keep the cron resilient.
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret')
  const expected = env.CRON_SECRET
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const result = await syncAllSocial()
    return NextResponse.json({ ok: true, result })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message ?? 'sync failed' },
      { status: 500 },
    )
  }
}
