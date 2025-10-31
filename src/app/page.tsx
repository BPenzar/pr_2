'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'

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
            <section className="relative py-24 sm:py-28">
              <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/80 p-10 text-center shadow-xl backdrop-blur">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(79,70,229,0.15),transparent_55%)]" />
                <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-6">
                  <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-1 text-sm font-medium text-blue-700">
                    Customer feedback, made effortless
                  </span>
                  <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
                    Business Feedback Tool
                  </h1>
                  <p className="text-lg leading-relaxed text-gray-600 sm:text-xl">
                    Collect meaningful insights through QR codes and embeddable web widgets. Ideal for restaurants, retail locations, digital products, and every team that puts customers first.
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
              </div>
            </section>

            <section className="pb-20">
              <div className="grid gap-6 md:grid-cols-3">
                {[
                  {
                    title: 'QR Code Feedback',
                    description:
                      'Generate branded QR codes for any physical location and let customers share feedback instantly.',
                  },
                  {
                    title: 'Web Widgets',
                    description:
                      'Embed lightweight feedback forms directly into your site or product without custom development.',
                  },
                  {
                    title: 'Analytics Dashboard',
                    description:
                      'Monitor sentiment trends, export data, and uncover insights that drive better customer experiences.',
                  },
                ].map((feature) => (
                  <div
                    key={feature.title}
                    className="rounded-2xl border border-white/60 bg-white/80 p-6 text-center shadow-md backdrop-blur transition duration-200 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <h3 className="text-lg font-semibold text-gray-900">
                      {feature.title}
                    </h3>
                    <p className="mt-3 text-sm text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    )
  }

  return null
}
