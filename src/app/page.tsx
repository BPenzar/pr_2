'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'

const features = [
  {
    title: 'QR & Web capture',
    description:
      'Launch branded QR codes and instant web widgets that route customers to bite-size forms in seconds.',
  },
  {
    title: 'Guided templates',
    description:
      'Kick-start every project with proven question packs tailored to hospitality, retail, and SaaS teams.',
  },
  {
    title: 'Insightful dashboards',
    description:
      'Track satisfaction trends, export CSVs, and loop your team in with automated digests.',
  },
]

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
      <div className="flex min-h-screen items-center justify-center text-white/80">
        Loading...
      </div>
    )
  }

  if (!user) {
    const destination = user ? '/dashboard' : '/'

    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader
          title="BSP Feedback Platform"
          subtitle="Capture and orchestrate customer signals everywhere"
          destination={destination}
        />
        <main className="flex flex-1 flex-col">
          <section className="relative isolate overflow-hidden border-b border-white/10 bg-black/20">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:gap-20 lg:py-24">
              <div className="max-w-3xl space-y-8 text-left">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/70">
                  Free MVP · Stripe-ready upgrades
                </span>
                <div className="space-y-6">
                  <h1 className="text-4xl font-semibold text-white sm:text-5xl lg:text-6xl">
                    Capture feedback everywhere customers connect with you.
                  </h1>
                  <p className="text-base text-white/70 sm:text-lg">
                    Deploy QR touchpoints for on-prem moments, embed web widgets on your site,
                    and orchestrate responses through Supabase with dashboards, limits, and upgrade paths
                    from day one.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link
                    href="/auth/signup"
                    className="group inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-500/80 px-6 py-3 text-sm font-semibold text-white shadow-[0_20px_45px_-20px_rgba(14,165,233,0.6)] transition hover:border-sky-300 hover:bg-sky-400/80"
                  >
                    Start for free
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="#features"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
                  >
                    See capabilities
                  </Link>
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/0 px-6 py-3 text-sm font-semibold text-white/70 transition hover:border-white/30 hover:bg-white/5 hover:text-white"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
              <div className="grid gap-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_40px_60px_-45px_rgba(15,118,110,0.55)] backdrop-blur sm:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                    Product snapshot
                  </p>
                  <h2 className="text-lg font-semibold text-white">
                    Unified QR, web, and kiosk feedback hub
                  </h2>
                  <p className="text-sm text-white/60">
                    Launch projects with ready-made templates, QR packs, and distribution hints to keep your service teams aligned.
                  </p>
                </div>
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                    Built-in analytics
                  </p>
                  <h2 className="text-lg font-semibold text-white">
                    Sentiment dashboards and automated summaries
                  </h2>
                  <p className="text-sm text-white/60">
                    Monitor NPS and satisfaction trends, export CSVs, and trigger digests to keep leadership informed weekly.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section
            id="features"
            className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:py-24"
          >
            <div className="max-w-2xl space-y-4">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                Platform capabilities
              </span>
              <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                Everything you need to instrument real-time feedback flows.
              </h2>
              <p className="text-base text-white/60 sm:text-lg">
                Modular projects, templated forms, and analytics that help SMB teams react faster to every signal.
              </p>
            </div>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="flex h-full flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-[0_20px_45px_-25px_rgba(8,47,73,0.55)] backdrop-blur transition hover:border-white/20 hover:bg-white/[0.06]"
                >
                  <h3 className="text-lg font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-white/70">{feature.description}</p>
                </div>
              ))}
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
    )
  }

  return null
}
