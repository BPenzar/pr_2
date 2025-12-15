import Link from 'next/link'
import { Header } from '@/components/layout/Header'

const lastUpdated = '2025-12-15'

export default function DataProcessingAddendumPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Data Processing Addendum (DPA)</h1>
          <p className="mt-2 text-sm text-gray-600">
            Last updated: {lastUpdated}. This page is a starter template and not legal advice. Please review with a
            qualified lawyer before using it in production.
          </p>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">1) Purpose</h2>
            <p>
              This DPA applies when you (the “Customer”) use the Service to collect or otherwise process end-user
              feedback data and we process personal data on your behalf as a processor under Article 28 GDPR.
            </p>
            <p>
              This DPA is incorporated into the{' '}
              <Link className="underline" href="/terms">
                Terms of Service
              </Link>{' '}
              and forms part of the agreement between the Customer and BSP Lab • Bruno Penzar.
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">2) Roles</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Customer is the <span className="font-medium">controller</span> for end-user feedback data.
              </li>
              <li>
                BSP Lab • Bruno Penzar is the <span className="font-medium">processor</span>.
              </li>
            </ul>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">3) Processing details (Annex 1)</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="font-medium">Subject matter:</span> hosting and operation of a feedback-collection
                platform.
              </li>
              <li>
                <span className="font-medium">Duration:</span> for the term of the Customer’s use of the Service, plus
                any period required for backups and legal obligations.
              </li>
              <li>
                <span className="font-medium">Nature and purpose:</span> collect, store, and provide analytics and export
                of feedback responses; prevent spam and abuse.
              </li>
              <li>
                <span className="font-medium">Types of personal data:</span> feedback responses (may include free-text),
                technical identifiers (e.g., hashed IP), user agent, timestamps.
              </li>
              <li>
                <span className="font-medium">Categories of data subjects:</span> Customer’s end users (e.g., customers,
                visitors), and Customer’s staff/admin users.
              </li>
            </ul>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">4) Processor obligations</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>Process personal data only on documented instructions from the Customer.</li>
              <li>Ensure persons authorized to process personal data are bound by confidentiality.</li>
              <li>Implement appropriate technical and organizational security measures (see Annex 2).</li>
              <li>
                Assist the Customer with responding to requests from data subjects and with GDPR compliance obligations
                (Articles 32–36), taking into account the nature of processing.
              </li>
              <li>Notify the Customer without undue delay after becoming aware of a personal data breach.</li>
              <li>
                At the Customer’s choice, delete or return personal data at the end of the provision of services, unless
                retention is required by law.
              </li>
              <li>Make available information reasonably necessary to demonstrate compliance and allow audits.</li>
            </ul>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">5) Subprocessors</h2>
            <p>
              Customer provides a general authorization for subprocessors required to deliver the Service. We remain
              responsible for their performance. Current subprocessors typically include hosting, database, and DNS
              providers such as Supabase, Vercel, and Cloudflare. Please verify the latest list before production use.
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">6) International transfers</h2>
            <p>
              Where subprocessors or infrastructure involve data transfers outside the EEA, appropriate safeguards will
              be used where required (for example, standard contractual clauses).
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">7) Security measures (Annex 2)</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>Encryption in transit (TLS) for connections to the Service.</li>
              <li>Access controls and least-privilege for administrative access.</li>
              <li>Row-level security in the database to isolate tenant data (where configured).</li>
              <li>Rate limiting and anti-spam controls to reduce abuse.</li>
              <li>Backups and disaster recovery mechanisms provided by infrastructure vendors.</li>
            </ul>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">8) Related documents</h2>
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
