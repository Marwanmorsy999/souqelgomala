import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { createImportJob, listImportJobs } from '@/services/catalog/admin-import-service'
import { hasPermission, type Role } from '@/lib/permissions'
import { ok, forbidden, validationError, serverError } from '@/services/api-response'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'imports.read')) {
    return forbidden('ليس لديك صلاحية لعرض الاستيراد')
  }
  try {
    const rows = await listImportJobs()
    return ok(rows)
  } catch (err) {
    return serverError((err as Error).message ?? 'فشل تحميل سجل الاستيراد')
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'imports.write')) {
    return forbidden('ليس لديك صلاحية لاستيراد البيانات')
  }
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return validationError({ body: ['Invalid JSON body'] })
  }
  const { type, filename } = body as { type: 'excel' | 'csv' | 'pdf'; filename: string }
  if (!type || !filename) {
    return validationError({ body: ['type and filename are required'] })
  }
  try {
    const job = await createImportJob(auth.user, { type, filename })
    return ok(job, 201)
  } catch (err) {
    return serverError((err as Error).message ?? 'تعذر إنشاء مهمة الاستيراد')
  }
}
