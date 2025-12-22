import Link from 'next/link'
import { Header } from '@/components/layout/Header'

const effectiveDate = '01.01.2026'
const version = '1.3'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
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
              <a className="underline" href="mailto:privacy@bsp-lab.dev">
                privacy@bsp-lab.dev
              </a>
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">1) Acceptance</h2>
            <p>
              By creating an account and checking the Terms box, you agree to these Terms. If you use the Service
              without creating an account, you agree to these Terms by accessing the Service.
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">2) Service</h2>
            <p>
              BSP Feedback is a software service that enables users to create feedback forms, generate QR codes, and
              collect responses (“Service”).
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">3) Accounts</h2>
            <p>
              You are responsible for your account, credentials, and all activity under your account. Notify us
              promptly of unauthorized access.
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">4) Acceptable use</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>Do not use the Service for unlawful, harmful, or abusive activities.</li>
              <li>Do not submit malicious or spam content.</li>
              <li>Do not attempt to access other users’ data or system components.</li>
              <li>Do not reverse engineer, scrape, or interfere with the Service.</li>
            </ul>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">5) Content and data</h2>
            <p>
              You are responsible for the content you create or collect through the Service, including any personal
              data. If you use the Service to collect data from end users, you are the controller for that data, and we
              act as your processor under the{' '}
              <Link className="underline" href="/dpa">
                Data Processing Addendum (DPA)
              </Link>
              .
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">6) Ownership</h2>
            <p>
              We retain all rights in the Service and its software. You retain rights to your content and feedback
              data.
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">7) Availability &amp; changes</h2>
            <p>
              We may modify, limit, suspend, or discontinue the Service (including free usage limits) at any time. We
              will provide notice of material changes, for example by email or in-app notice.
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">8) Free service / future limits</h2>
            <p>
              The Service may be offered for free and may include usage limits. We may introduce, change, or remove
              limits in the future.
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">9) Third-party services</h2>
            <p>
              The Service relies on third-party providers (hosting, database, DNS). We are not responsible for outages
              or changes in those services.
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">10) Disclaimers</h2>
            <p>
              The Service is provided “as is” and “as available.” We disclaim all warranties, including fitness for a
              particular purpose and non-infringement, to the extent permitted by law.
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">11) Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, BSP LAB is not liable for indirect, incidental, special, or
              consequential damages, loss of profits, or loss of data. If you are a consumer, nothing in these Terms
              limits your statutory consumer rights under applicable law. Our total liability for any claim will not
              exceed the amount you paid us in the last 12 months (or zero if the Service is free).
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">12) Termination</h2>
            <p>
              You may stop using the Service at any time. We may suspend or terminate access if you violate these Terms
              or for operational reasons.
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">13) Governing law</h2>
            <p>
              These Terms are governed by the laws of Croatia. Courts in Zagreb shall have jurisdiction unless
              mandatory law provides otherwise.
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">14) Contact</h2>
            <p>
              For questions about these Terms, contact{' '}
              <a className="underline" href="mailto:privacy@bsp-lab.dev">
                privacy@bsp-lab.dev
              </a>
              .
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">15) Related documents</h2>
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
