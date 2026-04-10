import { useState, useEffect, useCallback } from 'react'
import type { AuthResponse } from '@/types'

interface AuthUser {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'user'
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const saveAuth = useCallback((data: AuthResponse) => {
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  const isAdmin = user?.role === 'admin'

  return { user, loading, saveAuth, logout, isAdmin }
}
