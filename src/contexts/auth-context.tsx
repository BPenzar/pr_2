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
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [account, setAccount] = useState<Account | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [initializing, setInitializing] = useState(true)
  const [authLoading, setAuthLoading] = useState(false)

  useEffect(() => {
    // Get initial session
    const initSession = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        const session = data.session
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchAccount(session.user.id)
        } else {
          setInitializing(false)
        }
      } catch (error) {
        console.error('Failed to get initial session:', error)
        setSession(null)
        setUser(null)
        setInitializing(false)
      }
    }

    initSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchAccount(session.user.id)
      } else {
        setAccount(null)
        setInitializing(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchAccount = async (userId: string) => {
    console.log('Fetching account for userId:', userId)
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select(`
          *,
          plans (
            id,
            name,
            max_projects,
            max_forms_per_project,
            max_responses_per_form,
            features
          )
        `)
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('Error fetching account:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error
        })
      } else {
        console.log('Successfully fetched account:', data)
        setAccount(data as any)
      }
    } catch (error) {
      console.error('Error fetching account:', error)
    } finally {
      setInitializing(false)
    }
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
