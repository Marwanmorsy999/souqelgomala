import { NextRequest, NextResponse } from 'next/server'
import { logoutAction } from '@/services/auth'

export async function POST(request: NextRequest) {
  try {
    await logoutAction()
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    )
  }
}
