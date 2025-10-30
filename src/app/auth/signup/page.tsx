'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { SignupForm } from '@/components/auth/signup-form'
import { useAuth } from '@/contexts/auth-context'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'

const highlights = [
  'Publish QR, web, and kiosk touchpoints instantly',
  'Kick-start forms with industry-tested templates',
  'Unlock dashboards ready for leadership updates',
]

export default function SignupPage() {
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
        subtitle="Design feedback journeys customers love"
        destination={destination}
      />
      <main className="flex flex-1 items-center justify-center">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-16 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl space-y-6 text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white/70">
              Get started for free
            </span>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold text-white sm:text-5xl">
                Create your account and orchestrate feedback in minutes.
              </h1>
              <p className="text-base text-white/70 sm:text-lg">
                Build branded projects with QR codes, guided templates, and automated insights tailored for growing teams.
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
              <h2 className="text-2xl font-semibold text-white">Create your account</h2>
              <p className="text-sm text-white/60">
                Unlock QR feedback journeys, templated surveys, and dashboards built on Supabase.
              </p>
            </div>
            <SignupForm />
            <p className="mt-6 text-center text-xs text-white/40">
              Already onboard? <span className="text-white/70">Sign in from the landing page to continue.</span>
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
