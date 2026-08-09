/**
 * Authentication — Cloudflare Workers / D1 replacement for Supabase Auth.
 *
 * Uses D1 `profiles`, `sessions`, and `auth_audit_logs`.
 *
 * Password hashing: Web Crypto API (PBKDF2 + SHA-256) — see src/lib/crypto.ts.
 * Sessions: opaque bearer tokens; only a SHA-256 hash of the token is stored
 * in D1 (`sessions.session_token`). The raw token travels only in the HttpOnly
 * cookie, never in the database.
 *
 * Server-side only — no client-side exposure of secrets.
 */

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getDb } from '@/db'
import { profiles, sessions } from '@/db/schema/auth'
import { logger } from '@/lib/logger'
import { verifyTurnstile } from '@/services/turnstile'
import { generateOpaqueToken, hashToken, verifyPassword } from '@/lib/crypto'
import { eq } from 'drizzle-orm'

type User = typeof profiles.$inferSelect

export type { User }

export { hashPassword, verifyPassword, generateOpaqueToken } from '@/lib/crypto'

const SESSION_COOKIE = 'souk_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days
const CSRF_COOKIE = 'souk_csrf'

export async function createSession(userId: string) {
  const token = generateOpaqueToken()
  const hashedToken = await hashToken(token)
  const [session] = await getDb().insert(sessions).values({
    id: crypto.randomUUID(),
    profile_id: userId,
    session_token: hashedToken,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString(),
  }).returning()
  return { token, session }
}

export async function getSession(token: string) {
  const hashedToken = await hashToken(token)
  const session = await getDb().query.sessions.findFirst({
    where: eq(sessions.session_token, hashedToken),
  })
  if (!session || new Date(session.expires_at) < new Date()) {
    return null
  }
  const profile = await getDb().query.profiles.findFirst({
    where: eq(profiles.id, session.profile_id),
  })
  if (!profile) return null
  return { ...session, profile }
}

export async function deleteSession(token: string) {
  const hashedToken = await hashToken(token)
  await getDb().delete(sessions).where(eq(sessions.session_token, hashedToken))
}

export async function getUserFromSession(): Promise<User | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  const session = await getSession(token)
  return session?.profile ?? null
}

export async function loginAction(formData: FormData) {
  'use server'
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const password = String(formData.get('password') || '')
  const turnstileToken = String(formData.get('turnstile_token') || '')
  const csrfToken = String(formData.get('csrf_token') || '')

  const cookieStore = await cookies()
  const csrfCookie = cookieStore.get(CSRF_COOKIE)?.value
  if (!csrfToken || csrfToken !== csrfCookie) {
    return { error: 'Invalid CSRF token' }
  }

  if (turnstileToken) {
    const result = await verifyTurnstile(turnstileToken)
    if (!result.success) {
      return { error: 'Security check failed. Please try again.' }
    }
  }

  const user = await getDb().query.profiles.findFirst({
    where: eq(profiles.email, email),
  })

  if (!user || !user.password_hash) {
    return { error: 'Invalid email or password' }
  }

  const valid = await verifyPassword(password, user.password_hash)
  if (!valid) {
    return { error: 'Invalid email or password' }
  }

  if (!user.is_active) {
    return { error: 'Account is disabled' }
  }

  const { token } = await createSession(user.id)
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })

  logger.info('Auth: user logged in', { userId: user.id, email })
  return { success: true, redirectTo: '/admin' }
}

export async function logoutAction() {
  'use server'
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (token) {
    await deleteSession(token)
  }
  cookieStore.delete(SESSION_COOKIE)
  cookieStore.delete(CSRF_COOKIE)
  redirect('/admin/login')
}

export async function requireAuth(): Promise<User> {
  const user = await getUserFromSession()
  if (!user) {
    redirect('/admin/login')
  }
  return user
}

export async function requireRole(roles: string | string[]): Promise<User> {
  const user = await requireAuth()
  const allowed = Array.isArray(roles) ? roles : [roles]
  if (!allowed.includes(user.role)) {
    redirect('/admin/unauthorized')
  }
  return user
}






