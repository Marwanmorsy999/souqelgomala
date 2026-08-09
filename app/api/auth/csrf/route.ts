import { NextResponse } from 'next/server'

export async function GET() {
  const token = crypto.randomUUID()
  
  const response = NextResponse.json({ csrfToken: token })
  response.cookies.set('souk_csrf', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  })
  
  return response
}