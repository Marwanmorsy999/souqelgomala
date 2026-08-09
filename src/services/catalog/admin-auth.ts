/**
 * Admin catalog auth helpers — server-side.
 *
 * Safely resolves the currently authenticated admin user inside a route handler
 * and exposes a typed wrapper for the admin product/media API. Authorization is
 * enforced server-side (never rely on frontend checks).
 */

import { getUserFromSession, type User } from '@/services/auth'
import { unauthorized } from '@/services/api-response'
import { NextResponse } from 'next/server'

/** Resolve the authenticated user or return an unauthorized response. */
export async function requireAdminUser(): Promise<{ user: User } | NextResponse> {
  const user = await getUserFromSession()
  if (!user) {
    return unauthorized('يجب تسجيل الدخول')
  }
  return { user }
}

/**
 * Wrap a handler that needs an authenticated user.
 * Returns 401 if the user is not logged in.
 */
export async function withAdminUser<T>(
  handler: (user: User) => Promise<NextResponse>
): Promise<NextResponse> {
  const result = await requireAdminUser()
  if (result instanceof NextResponse) {
    return result
  }
  try {
    return await handler(result.user)
  } catch (err) {
    const status = (err as { status?: number }).status ?? 400
    const message = (err as Error).message ?? 'حدث خطأ'
    return NextResponse.json({ success: false, error: message }, { status })
  }
}
