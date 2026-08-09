import { NextRequest, NextResponse } from 'next/server'
import { getUserFromSession } from '@/services/auth'
import { db, profiles } from '@/db'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession()

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    // Fetch fresh user data
    const fullUser = await db.query.profiles.findFirst({
      where: eq(profiles.id, user.id),
      columns: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        role: true,
        is_active: true,
        avatar: true,
        created_at: true,
        updated_at: true,
      },
    })

    if (!fullUser) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    return NextResponse.json({ 
      user: {
        id: fullUser.id,
        email: fullUser.email,
        fullName: fullUser.full_name,
        phone: fullUser.phone,
        role: fullUser.role,
        isActive: fullUser.is_active,
        avatar: fullUser.avatar,
        createdAt: fullUser.created_at,
        updatedAt: fullUser.updated_at,
      }
    })
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 200 })
  }
}


