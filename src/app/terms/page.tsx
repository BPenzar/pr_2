import Link from 'next/link'
import { Header } from '@/components/layout/Header'

const lastUpdated = '2025-12-15'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
          <p className="mt-2 text-sm text-gray-600">
            Last updated: {lastUpdated}. This page is a starter template and not legal advice. Please review with a
            qualified lawyer before using it in production.
          </p>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">1) Agreement</h2>
            <p>
              These Terms govern your access to and use of Business Feedback Tool (the “Service”). By creating an
              account or using the Service, you agree to these Terms.
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">2) Your responsibilities</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>Provide accurate account information and keep it up to date.</li>
              <li>Maintain the confidentiality of your login credentials.</li>
              <li>Use the Service lawfully and responsibly.</li>
              <li>
                If you collect feedback from end users, you are responsible for providing appropriate notices and having
                a lawful basis to process any personal data submitted through your forms.
              </li>
            </ul>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">3) Acceptable use</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>Do not use the Service for unlawful, harmful, or abusive activities.</li>
              <li>Do not attempt to bypass security controls or interfere with the Service.</li>
              <li>Do not upload malware or content that infringes rights of others.</li>
            </ul>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">4) Data processing</h2>
            <p>
              When we process end-user feedback data on your behalf, the{' '}
              <Link className="underline" href="/dpa">
                Data Processing Addendum (DPA)
              </Link>{' '}
              is incorporated by reference into these Terms and forms part of the agreement between you and us.
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">5) Disclaimer</h2>
            <p>
              The Service is provided on an “as is” and “as available” basis. To the maximum extent permitted by law, we
              disclaim all warranties, express or implied.
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">6) Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, we will not be liable for indirect, incidental, special,
              consequential, or punitive damages, or any loss of profits, revenues, data, or goodwill.
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">7) Termination</h2>
            <p>
              You may stop using the Service at any time. We may suspend or terminate access if we reasonably believe
              you have violated these Terms or if required for security or legal reasons.
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">8) Contact</h2>
            <p>
              For questions about these Terms, contact{' '}
              <a className="underline" href="mailto:penzar.bruno@gmail.com">
                penzar.bruno@gmail.com
              </a>
              .
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">9) Related documents</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <Link className="underline" href="/privacy">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link className="underline" href="/dpa">
                  Data Processing Addendum (DPA)
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  )
}
