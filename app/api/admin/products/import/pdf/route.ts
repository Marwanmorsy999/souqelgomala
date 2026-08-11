import { NextRequest } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { createImportJob } from '@/services/catalog/admin-import-service'
import { hasPermission, type Role } from '@/lib/permissions'
import { ok, forbidden, validationError, serverError } from '@/services/api-response'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'imports.write')) {
    return forbidden('ليس لديك صلاحية لاستيراد PDF')
  }
  const form = await request.formData().catch(() => null)
  if (!form) return validationError({ body: ['Invalid form data'] })
  const file = form.get('file')
  if (!(file instanceof File)) {
    return validationError({ file: ['file is required'] })
  }
  try {
    // Placeholder: in production this would extract tables from the PDF using
    // pdf-table-extractor or similar, validate rows, and create draft products.
    const job = await createImportJob(auth.user, { type: 'pdf', filename: file.name })
    return ok({ success: true, jobId: job.id, message: 'PDF import queued for processing' }, 202)
  } catch (err) {
    return serverError((err as Error).message ?? 'فشل استيراد PDF')
  }
}
