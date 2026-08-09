'use client'

import { useCallback, useEffect, useState } from 'react'

interface AuthState {
  session: string | null
  user: User | null
  role: string | null
  loading: boolean
}

interface User {
  id: string
  email: string
  fullName: string
  role: string
  isActive: boolean
}

const initialState: AuthState = {
  session: null,
  user: null,
  role: null,
  loading: true,
}

/**
 * Central auth hook. Provides session, user, and role.
 * Polls the /api/auth/me endpoint to maintain session state.
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>(initialState)

  useEffect(() => {
    let mounted = true
    let interval: NodeJS.Timeout | null = null

    async function loadUser() {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store',
        })

        if (!mounted) return

        if (res.ok) {
          const data = await res.json()
          setState({
            session: data.user?.id || 'session',
            user: data.user,
            role: data.user?.role || null,
            loading: false,
          })
        } else {
          setState({ ...initialState, loading: false })
        }
      } catch {
        if (mounted) {
          setState({ ...initialState, loading: false })
        }
      }
    }

    loadUser()

    // Poll every 30 seconds to keep session fresh
    interval = setInterval(loadUser, 30000)

    return () => {
      mounted = false
      if (interval) clearInterval(interval)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } finally {
      setState(initialState)
      window.location.href = '/admin/login'
    }
  }, [])

  return {
    ...state,
    logout,
  }
}


