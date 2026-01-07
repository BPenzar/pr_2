'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
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
  {/**/}
  // Show landing page for non-authenticated users
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Header />
        <main className="flex-1">
          <section className="relative flex min-h-screen items-center py-12 sm:py-16">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(79,70,229,0.16),transparent_60%)]" />
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center -mt-10 sm:-mt-14">
                <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                  Feedback Collector
                </h1>
                <p className="text-lg leading-relaxed text-gray-600 sm:text-lg">
                  Effortlessly collecting customer feedback. Collect meaningful insights through forms, via QR codes or links. Perfect for physical locations, events, websites, or any team that wants simple feedback with clean analytics.
                </p>
                <div className="flex w-full flex-col items-center gap-6 sm:gap-7">
                  {/* <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
                      <Link href="/auth/signup" className="w-full sm:w-auto">
                        <Button size="lg" className="w-full sm:w-auto">
                          Sign up - it's free
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
                    */}
                  <span className="inline-flex items-center rounded-full border border-amber-100 bg-amber-50 px-4 py-1 text-sm font-medium text-amber-700">
                    Live example
                  </span>
                  <div className="flex w-full flex-col items-center gap-6 sm:flex-row sm:items-end sm:justify-center sm:gap-6">
                    <div className="flex w-full flex-col items-center gap-2 sm:w-auto sm:items-start">
                      <a
                        href="https://qr.bsp-lab.dev/f/wxEpRhWB"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto"
                      >
                        <Button
                          variant="outline"
                          size="lg"
                          className="w-full sm:w-auto border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                        >
                          Leave us your feedback
                        </Button>
                      </a>
                      <span className="text-xs text-slate-500">
                        Open the live form in a new tab.
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      <span>or</span>
                      <span>scan</span>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <Image
                          src="/qr-demo.png"
                          alt="QR code for the live feedback form"
                          width={160}
                          height={160}
                        />
                      </div>
                      <span className="text-xs text-slate-500">
                        Scan with your phone to open the form.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="how-it-works" className="flex min-h-screen items-center bg-white py-12 sm:py-16">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
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
                    href="https://bsp-lab.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Contact BSP Lab
                  </a>
                  .
                </p>
              </div>
            </div>
          </section>

          {/* Intentionally minimal: avoid feature "boxes" per preference */}
        </main>
      </div>
    )
  }

  return null
}
