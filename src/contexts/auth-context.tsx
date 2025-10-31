'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase-client'
import { Account } from '@/types/database'

interface AuthContextType {
  user: User | null
  account: Account | null
  session: Session | null
  loading: boolean
  authLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  resetPassword: (email: string) => Promise<{ error: any }>
  refreshAccount: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  account: null,
  session: null,
  loading: true,
  authLoading: false,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => ({ error: null }),
  resetPassword: async () => ({ error: null }),
  refreshAccount: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [account, setAccount] = useState<Account | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [initializing, setInitializing] = useState(true)
  const [authLoading, setAuthLoading] = useState(false)

  useEffect(() => {
    let isMounted = true

    const markReady = () => {
      if (isMounted) {
        setInitializing(false)
      }
    }

    // Get initial session
    const initSession = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        const currentSession = data.session
        setSession(currentSession)
        setUser(currentSession?.user ?? null)

        if (currentSession?.user) {
          let resolved = false
          const timeoutId = window.setTimeout(() => {
            if (!resolved) {
              console.warn('Account fetch timed out; proceeding without fresh data.')
              markReady()
            }
          }, 4000)

          fetchAccount(currentSession.user.id)
            .catch((error) => {
              console.error('Initial account fetch failed:', error)
            })
            .finally(() => {
              resolved = true
              window.clearTimeout(timeoutId)
              markReady()
            })
        } else {
          markReady()
        }
      } catch (error) {
        console.error('Failed to get initial session:', error)
        setSession(null)
        setUser(null)
        markReady()
      }
    }

    initSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        fetchAccount(session.user.id).catch((error) => {
          console.error('Account refresh failed:', error)
        })
      } else {
        setAccount(null)
      }

      markReady()
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const fetchAccount = async (userId: string) => {
    const fetchPromise = supabase
      .from('accounts')
      .select(
        `
          *,
          plans (
            id,
            name,
            max_projects,
            max_forms_per_project,
            max_responses_per_form,
            features
          )
        `
      )
      .eq('user_id', userId)
      .single()

    let timeoutId: ReturnType<typeof setTimeout> | undefined
    try {
      const result = await Promise.race([
        fetchPromise,
        new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('Account fetch timed out'))
          }, 4000)
        }),
      ])

      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      const { data, error } = result as Awaited<typeof fetchPromise>

      if (error) {
        throw error
      }

      setAccount(data as any)
      return true
    } catch (error) {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      console.error('Error fetching account:', error)
      return false
    }
  }
  const refreshAccount = async () => {
    if (!user?.id) return
    await fetchAccount(user.id)
  }

  const signIn = async (email: string, password: string) => {
    setAuthLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        return { error }
      }
      return { error: null }
    } finally {
      setAuthLoading(false)
    }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    setAuthLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })
      return { error }
    } finally {
      setAuthLoading(false)
    }
  }

  const signOut = async () => {
    setAuthLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        return { error }
      }

      setSession(null)
      setUser(null)
      setAccount(null)
      setInitializing(false)
      return { error: null }
    } finally {
      setAuthLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    return { error }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        account,
        session,
        loading: initializing,
        authLoading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        refreshAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
