import { NextRequest } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { hasPermission, type Role } from '@/lib/permissions'
import { uploadImageToCloudinary } from '@/lib/cloudinary/upload'
import { ok, forbidden, validationError, serverError } from '@/services/api-response'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs' // Cloudinary upload uses fetch; nodejs runtime avoids edge fs constraints.

/**
 * Admin media upload endpoint (server-side, authenticated, RBAC).
 *
 * POST /api/admin/media/upload
 *   multipart/form-data:
 *     - file: image file (validated: MIME, size, extension)
 *     - resourceType?: 'image' | 'video' | 'auto'
 *
 * Flow:
 *   1. Authenticate + authorize (products.write or categories.write).
 *   2. Validate the file (MIME, size, extension).
 *   3. Upload to Cloudinary (server-side; credentials never exposed).
 *   4. Return the Cloudinary metadata so the client can attach a D1 media record.
 *
 * A D1 media record is NOT created here — the caller (admin media route) creates
 * it only AFTER a successful upload, avoiding orphaned rows on failure.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth

  const canProducts = hasPermission(auth.user.role as Role, 'products.write')
  const canCategories = hasPermission(auth.user.role as Role, 'categories.write')
  if (!canProducts && !canCategories) {
    return forbidden('ليس لديك صلاحية لرفع الصور')
  }

  const form = await request.formData().catch(() => null)
  if (!form) return validationError({ body: ['Invalid form data'] })

  const file = form.get('file')
  if (!(file instanceof File)) {
    return validationError({ file: ['file is required'] })
  }

  const resourceTypeRaw = form.get('resourceType')
  const resourceType = resourceTypeRaw === 'video' ? 'video' : 'image'

  const buffer = new Uint8Array(await file.arrayBuffer())

  try {
    const result = await uploadImageToCloudinary({
      buffer,
      originalName: file.name,
      mimeType: file.type,
      resourceType,
    })

    if (typeof result.error === 'string' && result.error) {
      // Cloudinary not configured or a validation error — return a clear message.
      return ok(
        {
          pending: true,
          message: result.error,
          originalName: file.name,
        },
        200
      )
    }

    return ok(
      {
        cloudinaryPublicId: result.publicId,
        secureUrl: result.secureUrl,
        width: result.width,
        height: result.height,
        format: result.format,
        resourceType: result.resourceType,
        bytes: result.bytes,
        originalName: result.originalFilename || file.name,
      },
      201
    )
  } catch (err) {
    const message = (err as { message?: string }).message ?? 'تعذر رفع الصورة'
    if (message.includes('not allowed') || message.includes('exceeds') || message.includes('empty')) {
      return validationError({ file: [message] })
    }
    return serverError(message)
  }
}
