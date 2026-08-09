import { NextRequest, NextResponse } from 'next/server'
import { loginAction } from '@/services/auth'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const result = await loginAction(formData)

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    if (result.redirectTo) {
      return NextResponse.json(
        { success: true, redirectTo: result.redirectTo },
        { status: 200 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    )
  }
}

