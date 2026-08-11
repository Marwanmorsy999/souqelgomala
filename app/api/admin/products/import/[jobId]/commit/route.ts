import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { commitImportJob } from '@/services/catalog/admin-import-service'
import { hasPermission, type Role } from '@/lib/permissions'
import { ok, forbidden, serverError } from '@/services/api-response'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'imports.write')) {
    return forbidden('ليس لديك صلاحية لتأكيد الاستيراد')
  }
  let body: { skipErrors?: boolean }
  try {
    body = (await request.json()) as { skipErrors?: boolean }
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { 'content-type': 'application/json' } })
  }
  try {
    const { jobId } = await params
    const result = await commitImportJob(jobId, { skipErrors: body.skipErrors ?? false })
    return ok(result)
  } catch (err) {
    return serverError((err as Error).message ?? 'فشل تأكيد الاستيراد')
  }
}
