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

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const { error } = await signIn(email, password)

    if (error) {
      setError(error.message)
      setIsLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md border border-white/12 bg-white/[0.04] text-white shadow-[0_30px_50px_-30px_rgba(8,47,73,0.6)] backdrop-blur">
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl font-semibold text-white">Sign in</CardTitle>
        <CardDescription className="text-sm text-white/60">
          Enter your credentials to access your feedback control center
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

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
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/50 focus:border-sky-400 focus:ring-0"
            />
          </div>

          <Button
            type="submit"
            className="w-full rounded-full border border-sky-400/40 bg-sky-500/80 text-sm font-semibold text-white transition hover:border-sky-300 hover:bg-sky-400/80"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>

          <div className="space-y-3 text-center text-sm text-white/60">
            <Link
              href="/auth/forgot-password"
              className="text-white/70 transition hover:text-white"
            >
              Forgot your password?
            </Link>
            <div>
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-sky-400 hover:text-sky-300">
                Sign up
              </Link>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
