'use client'

import { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react'
import { User, Session, AuthChangeEvent, Provider } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase-client'
import { Account } from '@/types/database'

interface AuthContextType {
  user: User | null
  account: Account | null
  session: Session | null
  loading: boolean
  authLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signInWithOAuth: (provider: Provider, userData?: Record<string, unknown>) => Promise<{ error: any }>
  signUp: (
    email: string,
    password: string,
    fullName?: string,
    userData?: Record<string, unknown>
  ) => Promise<{ error: any }>
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
  signInWithOAuth: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => ({ error: null }),
  resetPassword: async () => ({ error: null }),
  refreshAccount: async () => {},
})

const OAUTH_METADATA_KEY = 'oauth-pending-metadata'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [account, setAccount] = useState<Account | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [initializing, setInitializing] = useState(true)
  const [authLoading, setAuthLoading] = useState(false)
  const userIdRef = useRef<string | null>(null)

  const applyPendingOAuthMetadata = useCallback(async (session: Session | null) => {
    if (!session?.user || typeof window === 'undefined') return

    let rawMetadata: string | null = null
    try {
      rawMetadata = window.sessionStorage.getItem(OAUTH_METADATA_KEY)
    } catch (error) {
      console.warn('Unable to read pending OAuth metadata.', error)
      return
    }

    if (!rawMetadata) return

    if (session.user.user_metadata?.legal_version) {
      window.sessionStorage.removeItem(OAUTH_METADATA_KEY)
      return
    }

    try {
      const parsed = JSON.parse(rawMetadata)
      if (parsed && typeof parsed === 'object') {
        await supabase.auth.updateUser({ data: parsed })
      }
    } catch (error) {
      console.warn('Failed to apply OAuth metadata.', error)
    } finally {
      window.sessionStorage.removeItem(OAUTH_METADATA_KEY)
    }
  }, [])

  const fetchAccount = useCallback(async (userId: string) => {
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

      if (userIdRef.current !== userId) {
        return true
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
  }, [])

  useEffect(() => {
    userIdRef.current = user?.id ?? null
  }, [user])

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

        await applyPendingOAuthMetadata(currentSession)

        if (currentSession?.user) {
          let resolved = false
          const timeoutId = setTimeout(() => {
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
              clearTimeout(timeoutId)
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
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      setSession(session)
      setUser(session?.user ?? null)

      applyPendingOAuthMetadata(session).catch((error) => {
        console.warn('Unable to apply OAuth metadata on auth change.', error)
      })

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
  }, [applyPendingOAuthMetadata, fetchAccount])
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

  const signInWithOAuth = async (provider: Provider, userData?: Record<string, unknown>) => {
    setAuthLoading(true)
    try {
      if (typeof window === 'undefined') {
        return { error: new Error('OAuth sign-in must be initiated in the browser.') }
      }

      if (userData) {
        try {
          window.sessionStorage.setItem(OAUTH_METADATA_KEY, JSON.stringify(userData))
        } catch (error) {
          console.warn('Unable to persist OAuth metadata.', error)
        }
      }

      const redirectTo = new URL('/auth/callback', window.location.origin).toString()
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
        },
      })

      return { error }
    } finally {
      setAuthLoading(false)
    }
  }

  const signUp = async (
    email: string,
    password: string,
    fullName?: string,
    userData?: Record<string, unknown>
  ) => {
    setAuthLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            ...(userData ?? {}),
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
    let errorResult: any = null

    const clearPersistedSession = () => {
      if (typeof window === 'undefined') return

      const projectRef =
        process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/^https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? null

      if (!projectRef) return

      const baseKey = `sb-${projectRef}-auth-token`
      const variants = [baseKey, `${baseKey}#D`, `${baseKey}#d`]

      try {
        const cookieNames = [
          `${baseKey}`,
          `${baseKey}#D`,
          `${baseKey}#d`,
          `${baseKey}-refresh-token`,
          `${baseKey}-access-token`,
          `${baseKey}#D-refresh-token`,
          `${baseKey}#d-refresh-token`
        ]

        const expireCookie = (name: string) => {
          document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`
        }

        cookieNames.forEach(expireCookie)
      } catch (cookieError) {
        console.warn('Failed to clear cached Supabase cookie session.', cookieError)
      }

      try {
        for (const key of variants) {
          window.localStorage.removeItem(key)
          window.sessionStorage.removeItem(key)
        }
      } catch (storageError) {
        console.warn('Failed to clear cached Supabase session storage.', storageError)
      }
    }

    try {
      const { error } = await supabase.auth.signOut()
      if (error?.message === 'Auth session missing!') {
        console.warn('Supabase signOut reported missing session; forcing cleanup and treating as success.')
        clearPersistedSession()
        setSession(null)
        setUser(null)
        setAccount(null)
        setInitializing(false)
        setAuthLoading(false)
        return { error: null }
      }
      if (error) {
        console.warn('Supabase signOut returned an error; clearing local session anyway.', error)
        errorResult = error
      }
    } catch (error) {
      console.error('Unexpected sign-out error; clearing local session anyway.', error)
      errorResult = error
    } finally {
      clearPersistedSession()
      userIdRef.current = null
      setSession(null)
      setUser(null)
      setAccount(null)
      setInitializing(false)
      setAuthLoading(false)
    }

    return { error: errorResult }
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
        signInWithOAuth,
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
