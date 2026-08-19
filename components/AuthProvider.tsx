"use client"
import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import createBrowserClient from '../lib/supabaseBrowser'

type AuthContextValue = {
  user: User | null
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue>({ user: null, isLoading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true
    let subscription: { unsubscribe: () => void } | null = null

    // Resolve the loading state in every path so the Navbar never stays
    // stuck on "…". If the client cannot be created (e.g. missing env vars
    // at runtime) or the session lookup fails, fall back to a logged-out UI.
    const finish = (user: User | null) => {
      if (!active) return
      setUser(user)
      setIsLoading(false)
    }

    try {
      const supabase = createBrowserClient()

      subscription = supabase.auth.onAuthStateChange((_event, session) => {
        finish(session?.user ?? null)
      }).data.subscription

      supabase.auth
        .getUser()
        .then(({ data: { user } }) => finish(user))
        .catch(() => finish(null))
    } catch {
      finish(null)
    }

    return () => {
      active = false
      subscription?.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
