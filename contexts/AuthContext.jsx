'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { clearSessionCookies, getTenantFromUser, persistSessionCookies } from '@/lib/auth'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const applySession = (session) => {
      const nextUser = session?.user || null

      setUser(nextUser)
      setTenant(getTenantFromUser(nextUser))
      persistSessionCookies(session)
    }

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      applySession(session)
      setLoading(false)
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        applySession(session)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password })
  }

  const signUp = async (email, password) => {
    return await supabase.auth.signUp({ email, password })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setTenant(null)
    clearSessionCookies()
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
