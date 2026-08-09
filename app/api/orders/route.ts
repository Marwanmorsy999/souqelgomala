import { NextRequest } from 'next/server'
import { createOrder } from '@/services/orders'
import { ok, validationError, serverError } from '@/services/api-response'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return validationError({ body: ['Invalid JSON body'] })
  }

  const b = body as Record<string, unknown>
  const items = Array.isArray(b.items) ? (b.items as Record<string, unknown>[]) : []
  const customerPhone = typeof b.customerPhone === 'string' ? b.customerPhone.trim() : ''
  const customerName = typeof b.customerName === 'string' ? b.customerName.trim() : ''
  const customerAddress = typeof b.customerAddress === 'string' ? b.customerAddress.trim() : ''

  if (!customerPhone || customerPhone.length < 10) {
    return validationError({ customerPhone: ['رقم الموبايل مطلوب'] })
  }
  if (items.length === 0) {
    return validationError({ items: ['السلة فارغة'] })
  }

  const parsedItems = items
    .map((it) => ({
      id: String(it.id ?? ''),
      name: String(it.name ?? ''),
      nameEn: it.nameEn ? String(it.nameEn) : undefined,
      quantity: Number(it.quantity) || 0,
      unitPrice: Number(it.unitPrice) || 0,
    }))
    .filter((it) => it.id && it.name && it.quantity > 0)

  if (parsedItems.length === 0) {
    return validationError({ items: ['لا توجد عناصر صالحة'] })
  }

  try {
    const result = await createOrder({
      customerName,
      customerPhone,
      customerAddress,
      notes: typeof b.notes === 'string' ? b.notes : undefined,
      deliveryFee: Number(b.deliveryFee) || 0,
      pricingMode: b.pricingMode === 'wholesale' ? 'wholesale' : 'retail',
      items: parsedItems,
      source: 'website',
    })
    return ok(result, 201)
  } catch (err) {
    return serverError((err as Error).message ?? 'تعذر حفظ الطلب')
  }
}
