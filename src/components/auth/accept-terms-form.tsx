'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { useAuth } from '@/contexts/auth-context'
import { LEGAL_VERSION } from '@/lib/legal'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function AcceptTermsForm() {
  const { user, loading } = useAuth()
  const [acceptedLegal, setAcceptedLegal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  const redirectTo = useMemo(() => {
    const value = searchParams.get('redirectTo')
    if (!value || !value.startsWith('/') || value.startsWith('//')) {
      return null
    }
    return value
  }, [searchParams])

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/auth/login')
      return
    }

    const metadata = user.user_metadata ?? {}
    if (
      metadata.legal_version === LEGAL_VERSION &&
      metadata.terms_accepted_at &&
      metadata.privacy_accepted_at
    ) {
      router.replace(redirectTo ?? '/dashboard')
    }
  }, [loading, user, redirectTo, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!acceptedLegal) {
      setError('Please accept the Terms of Service and Privacy Policy to continue.')
      return
    }

    setIsSubmitting(true)
    try {
      const acceptedAt = new Date().toISOString()
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          legal_version: LEGAL_VERSION,
          terms_accepted_at: acceptedAt,
          privacy_accepted_at: acceptedAt,
        },
      })

      if (updateError) {
        setError(updateError.message)
        return
      }

      router.replace(redirectTo ?? '/dashboard')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Accept terms</CardTitle>
        <CardDescription>
          Please accept the Terms of Service and Privacy Policy to continue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-start gap-3 rounded-md border bg-muted/30 p-3">
            <Checkbox
              id="legal"
              checked={acceptedLegal}
              onCheckedChange={(checked) => setAcceptedLegal(checked === true)}
              disabled={isSubmitting}
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
            disabled={isSubmitting || !acceptedLegal}
          >
            {isSubmitting ? 'Saving...' : 'Continue'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
