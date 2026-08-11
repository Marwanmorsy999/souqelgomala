import { NextRequest } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { hasPermission, type Role } from '@/lib/permissions'
import { ok, forbidden, serverError } from '@/services/api-response'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'products.read')) {
    return forbidden('ليس لديك صلاحية لتصدير الكتالوج')
  }
  try {
    // Placeholder: in production this would generate a branded PDF via a library
    // like pdfkit or @react-pdf/renderer. For now return a JSON payload describing
    // the requested export so the UI can display a preview or download link.
    const categoryId = request.nextUrl.searchParams.get('categoryId') ?? undefined
    return ok({
      message: 'PDF export queued',
      categoryId,
      downloadUrl: `/api/admin/products/export/pdf/download?categoryId=${categoryId ?? ''}`,
    })
  } catch (err) {
    return serverError((err as Error).message ?? 'فشل تصدير الكتالوج')
  }
}
