'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { LoginForm } from '@/components/auth/login-form'
import { useAuth } from '@/contexts/auth-context'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'

const highlights = [
  'Launch feedback flows in under 5 minutes',
  'Blend QR, web, and kiosk experiences',
  'Track sentiment with instant dashboards',
]

export default function LoginPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard')
    }
  }, [user, loading, router])

  const destination = user ? '/dashboard' : '/'

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader
        title="BSP Feedback Platform"
        subtitle="AI-assisted customer insight control center"
        destination={destination}
      />
      <main className="flex flex-1 items-center justify-center">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-16 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl space-y-6 text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white/70">
              BSP Feedback Platform
            </span>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold text-white sm:text-5xl">
                Sign in and orchestrate every feedback moment.
              </h1>
              <p className="text-base text-white/70 sm:text-lg">
                Manage branded QR journeys, rich surveys, and AI-assisted insights in one control center built for modern service teams.
              </p>
            </div>
            <ul className="space-y-3 text-sm text-white/70">
              {highlights.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5">
                    <Check className="h-4 w-4 text-sky-400" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="hidden lg:block">
              <div className="mt-10 h-px w-48 bg-gradient-to-r from-white/10 via-white/40 to-transparent" />
            </div>
          </div>
          <div className="w-full max-w-md rounded-3xl border border-white/12 bg-black/60 p-8 shadow-[0_30px_60px_-30px_rgba(8,47,73,0.6)] backdrop-blur">
            <div className="mb-8 space-y-2 text-left">
              <h2 className="text-2xl font-semibold text-white">Welcome back</h2>
              <p className="text-sm text-white/60">
                Use your BSP Feedback credentials to continue.
              </p>
            </div>
            <LoginForm />
            <p className="mt-6 text-center text-xs text-white/40">
              Need an account? <span className="text-white/70">Sign up in seconds from the landing page.</span>
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
