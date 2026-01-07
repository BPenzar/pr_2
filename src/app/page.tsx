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
      <div className="flex min-h-screen flex-col bg-white">
        <Header />
        <main className="flex-1">
          <section className="flex min-h-screen items-start bg-slate-50 pb-12 pt-24 sm:pb-16 sm:pt-32">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
                <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                  Feedback Collector
                </h1>
                <p className="mt-4 text-lg leading-relaxed text-gray-600 sm:text-lg">
                  Create simple feedback forms and share them instantly with a link or QR code.
                  <br />
                  Customers scan and answer, while you see the results directly in clear dashboards. Designed for physical locations, events, and websites where fast, low-friction feedback matters — no complexity, just usable insights.
                </p>
                
                <div className="mt-14 flex w-full flex-col items-center gap-3 sm:mt-18">
                  <span className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-700">
                    Live example
                  </span>
                  <span className="text-sm text-slate-500">
                    Try the form instantly by clicking or scanning.
                  </span>
                </div>
                <div className="mt-8 grid w-full max-w-4xl items-center gap-6 sm:grid-cols-[auto_auto_auto] sm:justify-center">
                  <div className="flex flex-col items-center gap-2 sm:items-center">
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
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    or use
                  </span>
                  <div className="flex flex-col items-center gap-2">
                    <Image
                      src="/qr-demo.png"
                      alt="QR code for the live feedback form"
                      width={220}
                      height={220}
                    />
                    <span className="text-xs text-slate-500">
                      Scan with your phone to open the form.
                    </span>
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
