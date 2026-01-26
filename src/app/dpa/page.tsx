import Link from 'next/link'
import { Header } from '@/components/layout/Header'

const effectiveDate = '01.01.2026'
const version = '1.3'

export default function DataProcessingAddendumPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Data Processing Addendum (DPA)</h1>
          <p className="mt-2 text-sm text-gray-600">
            Effective date: {effectiveDate}. Version {version}.
          </p>

          <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-700">
            <p className="font-semibold text-gray-900">Provider</p>
            <p className="mt-2">
              BSP LAB, obrt za ostalo računalno programiranje, vl. Bruno Sebastian Penzar
              <br />
              ULICA ĐURE CRNATKA 24, 10000 ZAGREB, Croatia
              <br />
              OIB: 00357376233
              <br />
              Contact:{' '}
              <a className="underline" href="mailto:bruno.penzar@bsp-lab.dev">
                bruno.penzar@bsp-lab.dev
              </a>
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">1) Roles</h2>
            <p>
              You are the <span className="font-medium">controller</span>. BSP LAB is the <span className="font-medium">processor</span>.
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">2) Processor instructions</h2>
            <p>We process personal data only on documented instructions from the controller.</p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">3) Subject matter &amp; duration</h2>
            <p>
              Processing of feedback responses and related metadata for the duration of your account and until deletion
              request (plus backup retention up to 30 days).
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">4) Nature &amp; purpose</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>collect and store feedback responses</li>
              <li>provide analytics and exports</li>
              <li>ensure security and abuse prevention</li>
            </ul>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">5) Categories of data</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>feedback content (text, ratings, selections)</li>
              <li>timestamps</li>
              <li>location labels</li>
              <li>IP hash</li>
              <li>user-agent hash</li>
            </ul>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">6) Subprocessors</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>Vercel (hosting)</li>
              <li>Supabase (database/auth)</li>
              <li>Cloudflare (DNS/network)</li>
              <li>Google (Gmail support communications)</li>
            </ul>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">7) Subprocessor updates</h2>
            <p>
              We may update or replace subprocessors. We will provide notice of material changes to our subprocessors,
              for example via the Service or by email.
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">8) Security measures</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>access control and least-privilege permissions</li>
              <li>encryption in transit (TLS)</li>
              <li>secure hosting environments</li>
            </ul>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">9) Data subject rights</h2>
            <p>
              We will assist you in fulfilling data subject requests to the extent required by law and feasible.
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">10) Breach notification</h2>
            <p>
              We will notify the controller without undue delay after becoming aware of a personal data breach.
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">11) Deletion or return</h2>
            <p>
              Upon account deletion or request, we will delete data unless retention is required by law. Account
              deletion cascades removal of associated projects, forms, responses, and QR codes. Backup retention up to
              30 days.
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">12) International transfers</h2>
            <p>
              If data is transferred outside the EEA, we rely on SCCs or other lawful safeguards from our
              subprocessors.
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">13) Audits</h2>
            <p>
              You may request information about our security measures. Formal audits may be provided where reasonable.
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">14) Related documents</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <Link className="underline" href="/terms">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link className="underline" href="/privacy">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  )
}
