'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

export function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const { signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setMessage(null)

    const { error } = await signUp(email, password, fullName)

    if (error) {
      setError(error.message)
      setIsLoading(false)
    } else {
      setMessage('Please check your email to verify your account.')
      setIsLoading(false)
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md border border-white/12 bg-white/[0.04] text-white shadow-[0_30px_50px_-30px_rgba(8,47,73,0.6)] backdrop-blur">
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl font-semibold text-white">Create your account</CardTitle>
        <CardDescription className="text-sm text-white/60">
          Launch QR feedback journeys, templated forms, and dashboard analytics in minutes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
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
            <Label htmlFor="fullName" className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
              Full Name
            </Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading}
              className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/50 focus:border-sky-400 focus:ring-0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/50 focus:border-sky-400 focus:ring-0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              minLength={6}
              className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/50 focus:border-sky-400 focus:ring-0"
            />
            <p className="text-xs text-white/50">
              Password must be at least 6 characters long
            </p>
          </div>

          <Button
            type="submit"
            className="w-full rounded-full border border-sky-400/40 bg-sky-500/80 text-sm font-semibold text-white transition hover:border-sky-300 hover:bg-sky-400/80"
            disabled={isLoading}
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </Button>

          <div className="text-center text-sm text-white/60">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-sky-400 hover:text-sky-300">
              Sign in
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
