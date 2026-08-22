import { NextRequest } from 'next/server'
import { requireAdminUser } from '@/services/catalog/admin-auth'
import { hasPermission, type Role } from '@/lib/permissions'
import { ok, forbidden, serverError, validationError } from '@/services/api-response'
import { createAdminOrder, listOrders, type AdminCreateOrderItemInput } from '@/services/orders'

export const dynamic = 'force-dynamic'

/** GET /api/admin/orders — list orders (RBAC: orders.read). */
export async function GET() {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'orders.read')) {
    return forbidden('ليس لديك صلاحية لعرض الطلبات')
  }
  try {
    const rows = await listOrders()
    return ok(rows)
  } catch (err) {
    return serverError((err as Error).message ?? 'فشل تحميل الطلبات')
  }
}

/**
 * POST /api/admin/orders — create a manual (phone/walk-in) order
 * (RBAC: orders.write).
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminUser()
  if (auth instanceof Response) return auth
  if (!hasPermission(auth.user.role as Role, 'orders.write')) {
    return forbidden('ليس لديك صلاحية لإنشاء الطلبات')
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return validationError({ body: ['Invalid JSON body'] })
  }
  const raw = body as Record<string, unknown>

  const customerName = typeof raw.customerName === 'string' ? raw.customerName.trim() : ''
  const customerPhone = typeof raw.customerPhone === 'string' ? raw.customerPhone.trim() : ''
  const errors: Record<string, string[]> = {}
  if (!customerName) errors.customerName = ['اسم العميل مطلوب']
  const phoneDigits = customerPhone.replace(/\D/g, '')
  if (phoneDigits.length < 10 || phoneDigits.length > 15) {
    errors.customerPhone = ['رقم الهاتف غير صالح']
  }
  const itemsRaw = Array.isArray(raw.items) ? raw.items : []
  const items: AdminCreateOrderItemInput[] = []
  for (const entry of itemsRaw) {
    const it = entry as Record<string, unknown>
    const name = typeof it.name === 'string' ? it.name.trim() : ''
    const quantity = Number(it.quantity)
    const unitPrice = Number(it.unitPrice)
    if (!name) continue
    if (!Number.isFinite(quantity) || quantity <= 0) {
      errors.items = ['الكميات يجب أن تكون أكبر من صفر']
      continue
    }
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      errors.items = ['أسعار الأصناف غير صالحة']
      continue
    }
    items.push({
      productId: typeof it.productId === 'string' && it.productId ? it.productId : null,
      name,
      quantity,
      unitPrice,
    })
  }
  if (items.length === 0 && !errors.items) {
    errors.items = ['أضف صنفاً واحداً على الأقل']
  }
  const deliveryFeeRaw = Number(raw.deliveryFee ?? 0)
  const deliveryFee = Number.isFinite(deliveryFeeRaw) && deliveryFeeRaw >= 0 ? deliveryFeeRaw : 0

  if (Object.keys(errors).length > 0) {
    return validationError(errors)
  }

  try {
    const created = await createAdminOrder({
      customerName,
      customerPhone,
      customerAddress: typeof raw.customerAddress === 'string' ? raw.customerAddress : undefined,
      notes: typeof raw.notes === 'string' ? raw.notes : undefined,
      deliveryFee,
      items,
    })
    return ok(created, 201)
  } catch (err) {
    return validationError({ order: [(err as Error).message ?? 'تعذر إنشاء الطلب'] })
  }
}
