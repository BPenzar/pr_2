'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

export function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [acceptedLegal, setAcceptedLegal] = useState(false)
  const { signUp, authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading) {
      setIsSubmitting(false)
    }
  }, [authLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setMessage(null)

    if (!acceptedLegal) {
      setIsSubmitting(false)
      setError('Please accept the Terms of Service and Privacy Policy to continue.')
      return
    }

    const acceptedAt = new Date().toISOString()
    const { error } = await signUp(email, password, undefined, {
      legal_version: '2025-12-15',
      terms_accepted_at: acceptedAt,
      privacy_accepted_at: acceptedAt,
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage('Please check your email to verify your account.')
    }
  }

  const isLoading = isSubmitting || authLoading

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>
          Sign up for a free account to get started
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

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
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              minLength={6}
            />
            <p className="text-xs text-muted-foreground">
              Password must be at least 6 characters long
            </p>
          </div>

          <div className="flex items-start gap-3 rounded-md border bg-muted/30 p-3">
            <Checkbox
              id="legal"
              checked={acceptedLegal}
              onCheckedChange={(checked) => setAcceptedLegal(checked === true)}
              disabled={isLoading}
              className="mt-0.5"
            />
            <Label htmlFor="legal" className="text-sm leading-snug text-muted-foreground">
              I agree to the{' '}
              <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">
                Terms of Service
              </Link>{' '}
              and have read the{' '}
              <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
                Privacy Policy
              </Link>
              .
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !acceptedLegal}
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
