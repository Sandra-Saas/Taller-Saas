'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getTenantFromUser } from '@/lib/auth'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentSession, setCurrentSession] = useState(null)

  const syncAuthCookies = async (session, options = {}) => {
    try {
      const allowClear = options.allowClear === true
      const method = session?.access_token ? 'POST' : 'DELETE'
      const payload = session?.access_token
        ? {
            accessToken: session.access_token,
            expiresAt: session.expires_at || null,
          }
        : undefined

      if (!session?.access_token && !allowClear) {
        return
      }

      await fetch('/api/auth/cookies', {
        method,
        headers: payload ? { 'Content-Type': 'application/json' } : undefined,
        body: payload ? JSON.stringify(payload) : undefined,
      })
    } catch (error) {
      console.error('No se pudieron sincronizar las cookies HttpOnly de la sesión', error)
    }
  }

  const getDeviceInfo = () => {
    if (typeof window === 'undefined') {
      return null
    }

    return {
      platform: navigator.platform || '',
      language: navigator.language || '',
      deviceLabel: navigator.userAgent || '',
    }
  }

  const syncServerSession = async (session) => {
    if (!session?.access_token) {
      return
    }

    try {
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
          deviceInfo: getDeviceInfo(),
        }),
      })
    } catch (error) {
      console.error('No se pudo sincronizar la sesión actual', error)
    }
  }

  useEffect(() => {
    const applySession = (session) => {
      const nextUser = session?.user || null

      setUser(nextUser)
      setTenant(getTenantFromUser(nextUser))
      setCurrentSession(session || null)
    }

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      applySession(session)
      await syncAuthCookies(session)
      await syncServerSession(session)
      setLoading(false)
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        applySession(session)
        await syncAuthCookies(session, { allowClear: _event === 'SIGNED_OUT' })
        await syncServerSession(session)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!currentSession?.access_token) {
      return undefined
    }

    const interval = window.setInterval(async () => {
      try {
        const response = await fetch('/api/auth/session', {
          method: 'GET',
          cache: 'no-store',
        })

        if (!response.ok) {
          return
        }

        const data = await response.json()
        if (data.active === false) {
          await supabase.auth.signOut()
          setUser(null)
          setTenant(null)
          setCurrentSession(null)
          await syncAuthCookies(null, { allowClear: true })
        }
      } catch (error) {
        console.error('No se pudo validar el estado remoto de la sesión', error)
      }
    }, 60000)

    return () => window.clearInterval(interval)
  }, [currentSession])

  const signIn = async (email, password) => {
    const result = await supabase.auth.signInWithPassword({ email, password })
    const session = result.data?.session || null

    if (!result.error && session?.access_token) {
      setUser(session.user || null)
      setTenant(getTenantFromUser(session.user || null))
      setCurrentSession(session)
      await syncAuthCookies(session)
      await syncServerSession(session)
    }

    return result
  }

  const signUp = async (email, password) => {
    return await supabase.auth.signUp({ email, password })
  }

  const signOut = async (options = {}) => {
    if (!options.skipServerCleanup) {
      try {
        await fetch('/api/auth/session', {
          method: 'DELETE',
        })
      } catch (error) {
        console.error('No se pudo limpiar la sesión del servidor', error)
      }
    }

    await supabase.auth.signOut()
    setUser(null)
    setTenant(null)
    setCurrentSession(null)
    await syncAuthCookies(null, { allowClear: true })
  }

  return (
    <AuthContext.Provider value={{ user, tenant, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
