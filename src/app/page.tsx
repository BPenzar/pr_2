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
          <section className="flex min-h-screen items-center bg-white py-12 sm:py-16">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mx-auto flex max-w-4xl flex-col items-center text-center -mt-8 sm:-mt-12">
                <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                  Feedback Collector
                </h1>
                <p className="mt-3 text-lg leading-relaxed text-gray-600 sm:text-lg">
                  Effortlessly collecting customer feedback. Collect meaningful insights through forms, via QR codes or links. Perfect for physical locations, events, websites, or any team that wants simple feedback with clean analytics.
                </p>
                <div className="mt-10 w-full max-w-4xl rounded-3xl border border-slate-200 bg-slate-50 px-6 py-7 sm:px-8">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-600">
                      Live example
                    </span>
                    <span className="text-xs text-slate-500">
                      Try the form instantly by clicking or scanning.
                    </span>
                  </div>
                  <div className="mt-6 grid w-full items-center gap-6 sm:grid-cols-[auto_auto_auto] sm:justify-center">
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
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      or use
                    </span>
                    <div className="flex items-center justify-center">
                      <Image
                        src="/qr-demo.png"
                        alt="QR code for the live feedback form"
                        width={180}
                        height={180}
                      />
                    </div>
                  </div>
                  <div className="mt-3 grid w-full gap-2 text-xs text-slate-500 sm:grid-cols-[auto_auto_auto] sm:justify-center">
                    <span className="text-center sm:text-left">
                      Open the live form in a new tab.
                    </span>
                    <span className="hidden sm:block" />
                    <span className="text-center sm:text-right">
                      Scan with your phone to open the form.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="how-it-works" className="flex min-h-screen items-center bg-slate-50 py-12 sm:py-16">
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
