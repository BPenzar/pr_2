'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { HowItWorksSlideshow } from '@/components/marketing/how-it-works-slideshow'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  // Show landing page for non-authenticated users
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-indigo-50/60 to-blue-100/60">
        <Header />
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <section className="relative pb-8 pt-14 sm:pb-10 sm:pt-16">
              <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(79,70,229,0.16),transparent_60%)]" />
              <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
                <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-1 text-sm font-medium text-blue-700">
                  Customer feedback, made effortless
                </span>
                <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
                  BSP Feedback
                </h1>
                <p className="text-lg leading-relaxed text-gray-600 sm:text-xl">
                  Collect meaningful insights through QR code forms. Perfect for physical locations, events, and any team that wants simple feedback with clean analytics.
                </p>
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
                  <Link href="/auth/signup" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto">
                      Get Started Free
                    </Button>
                  </Link>
                  <Link href="/auth/login" className="w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto bg-white/90 backdrop-blur hover:bg-white"
                    >
                      Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            </section>

            <section id="how-it-works" className="pb-14">
              <div className="mx-auto max-w-4xl text-center">
                <h2 className="mb-3 text-2xl font-semibold text-gray-900 sm:text-3xl">
                  See How It Works
                </h2>
                <p className="mb-6 text-lg text-gray-600">
                  Watch how easy it is to collect and manage customer feedback
                </p>
                <HowItWorksSlideshow />
                <p className="mt-5 text-sm text-gray-500">
                  Want something like this for your business?{' '}
                  <a
                    className="underline underline-offset-2 hover:text-gray-700"
                    href="mailto:penzar.bruno@gmail.com"
                  >
                    Contact BSP Lab
                  </a>
                  .
                </p>
              </div>
            </section>

            {/* Intentionally minimal: avoid feature "boxes" per preference */}
          </div>
        </main>
      </div>
    )
  }

  return null
}
