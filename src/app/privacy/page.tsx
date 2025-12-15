import Link from 'next/link'
import { Header } from '@/components/layout/Header'

const lastUpdated = '2025-12-15'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="mt-2 text-sm text-gray-600">
            Last updated: {lastUpdated}. This page is a starter template and not legal advice. Please review with a
            qualified lawyer before using it in production.
          </p>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">1) Who we are</h2>
            <p>
              Business Feedback Tool (“Service”) is operated by BSP Lab • Bruno Penzar (“we”, “us”). Contact:{' '}
              <a className="underline" href="mailto:penzar.bruno@gmail.com">
                penzar.bruno@gmail.com
              </a>
              .
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">2) Roles under GDPR</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                For account/administration data (e.g., your admin email, billing, settings), we generally act as a
                <span className="font-medium"> data controller</span>.
              </li>
              <li>
                For feedback responses submitted by your customers via QR/web forms, your business generally acts as the
                <span className="font-medium"> data controller</span> and we act as a{' '}
                <span className="font-medium">data processor</span> on your behalf.
              </li>
            </ul>
            <p>
              If you are an end user submitting feedback, please contact the business displayed on the form for
              controller-specific requests. We can assist them as their processor.
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">3) What data we collect</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="font-medium">Account data:</span> name, email address, authentication/session data.
              </li>
              <li>
                <span className="font-medium">Feedback content:</span> answers you (or your customers) submit to forms.
              </li>
              <li>
                <span className="font-medium">Technical/usage data:</span> timestamps, event logs, and anti-abuse signals
                (for example, a hashed IP and a shortened/encoded user agent string).
              </li>
              <li>
                <span className="font-medium">Cookies:</span> essential cookies required for login/session handling.
              </li>
            </ul>
            <p>
              Feedback answers may contain personal data if a respondent enters it into free-text fields. Please design
              your forms accordingly and avoid requesting sensitive information unless you have a lawful basis and proper
              safeguards.
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">4) Why we process data (purposes)</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>Provide, secure, and operate the Service (accounts, authentication, hosting, database).</li>
              <li>Prevent abuse and spam (rate limiting, fraud detection, security logging).</li>
              <li>Customer support and service communications (e.g., verification emails).</li>
              <li>Compliance with legal obligations where applicable.</li>
            </ul>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">5) Legal bases (EEA/UK)</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="font-medium">Contract</span> (Article 6(1)(b)): to provide the Service you request.
              </li>
              <li>
                <span className="font-medium">Legitimate interests</span> (Article 6(1)(f)): to secure and improve the
                Service (e.g., preventing spam).
              </li>
              <li>
                <span className="font-medium">Legal obligation</span> (Article 6(1)(c)): when we must comply with law.
              </li>
              <li>
                <span className="font-medium">Consent</span> (Article 6(1)(a)): only where we explicitly ask for it (for
                example, optional marketing).
              </li>
            </ul>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">6) Sharing and subprocessors</h2>
            <p>
              We use service providers (“subprocessors”) to run the Service. Based on the current setup, this typically
              includes:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Supabase (database and authentication)</li>
              <li>Vercel (hosting)</li>
              <li>Cloudflare (DNS and security services)</li>
              <li>Google (email/support tooling where used)</li>
            </ul>
            <p>
              Your use of the Service may also involve your own tools and processors. You are responsible for ensuring
              you have appropriate agreements and disclosures in place for your configuration.
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">7) International transfers</h2>
            <p>
              We aim to host data in the EU/EEA where possible. If any processing involves transfers outside the EEA, we
              rely on appropriate safeguards (such as standard contractual clauses) where required.
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">8) Retention</h2>
            <p>
              We keep personal data only as long as needed for the purposes described above, including providing the
              Service and meeting legal obligations. You can request account deletion via the in-app settings where
              available.
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">9) Your rights</h2>
            <p>
              Depending on your location, you may have rights to access, correct, delete, restrict, or object to our
              processing, and to data portability. You also have the right to lodge a complaint with your supervisory
              authority.
            </p>
            <p>
              To exercise rights for your admin/account data, you can use the in-app settings (where available) or email{' '}
              <a className="underline" href="mailto:penzar.bruno@gmail.com">
                penzar.bruno@gmail.com
              </a>{' '}
              from the email address associated with your account. We may request additional information to verify your
              identity and aim to respond within 30 days. For feedback submitted to a business using this Service, please
              contact that business (the controller); we can assist them as a processor.
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">10) Related documents</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <Link className="underline" href="/terms">
                  Terms of Service
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
