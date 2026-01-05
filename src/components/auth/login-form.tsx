'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'
import { GoogleButton } from '@/components/auth/google-button'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signIn, signInWithOAuth, authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const redirectTo = (() => {
    const value = searchParams.get('redirectTo')
    if (!value || !value.startsWith('/') || value.startsWith('//')) {
      return null
    }
    return value
  })()

  useEffect(() => {
    const oauthError = searchParams.get('error')
    if (!oauthError) return

    const errorDescription = searchParams.get('error_description')
    if (errorDescription) {
      setError(errorDescription)
      return
    }

    const errorMap: Record<string, string> = {
      oauth_missing_code: 'Google sign-in did not complete. Please try again.',
      oauth_exchange_failed: 'We could not finish Google sign-in. Please try again.',
      access_denied: 'Google sign-in was cancelled. Please try again.',
    }

    setError(errorMap[oauthError] ?? 'Unable to sign in with Google. Please try again.')
  }, [searchParams])

  useEffect(() => {
    if (!authLoading) {
      setIsSubmitting(false)
    }
  }, [authLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const { error } = await signIn(email, password)

    if (error) {
      setError(error.message)
    } else {
      router.push(redirectTo ?? '/dashboard')
    }
  }

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true)
    setError(null)

    const { error } = await signInWithOAuth('google', undefined, redirectTo ?? undefined)

    if (error) {
      setError(error.message ?? 'Failed to sign in with Google.')
    }
  }

  const isLoading = isSubmitting || authLoading

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Enter your email and password to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <GoogleButton
            disabled={isLoading}
            onClick={handleGoogleSignIn}
          />

          <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            <span>or sign in with email</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>

          <div className="text-center space-y-2">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-muted-foreground hover:underline"
            >
              Forgot your password?
            </Link>
            <div className="text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
