import Link from 'next/link'
import { Header } from '@/components/layout/Header'

const effectiveDate = '01.01.2026'
const version = '1.3'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
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
            <h2 className="text-xl font-semibold text-gray-900">1) Roles (GDPR)</h2>
            <p>
              For your account data and use of the Service, BSP LAB is the <span className="font-medium">controller</span>.
            </p>
            <p>
              For feedback data collected on behalf of your customers, BSP LAB is the <span className="font-medium">processor</span>,
              and you are the <span className="font-medium">controller</span>. See the{' '}
              <Link className="underline" href="/dpa">
                DPA
              </Link>
              .
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">2) Data we collect</h2>
            <p className="font-medium text-gray-900">Account data (controller)</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>email address, account name</li>
              <li>authentication/session data</li>
            </ul>
            <p className="mt-4 font-medium text-gray-900">Feedback data (processor for you)</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>form responses (text, ratings, selections)</li>
              <li>timestamps</li>
              <li>location labels (if used)</li>
              <li>IP hash (not raw IP)</li>
              <li>user-agent hash</li>
            </ul>
            <p className="mt-4 font-medium text-gray-900">Technical data</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>basic request logs, security and abuse signals</li>
              <li>device/browser data where technically necessary</li>
            </ul>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">3) Purposes &amp; legal basis</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>Provide the Service (contract)</li>
              <li>Security and abuse prevention (legitimate interest)</li>
              <li>Legal compliance (legal obligation)</li>
            </ul>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">4) Retention</h2>
            <p>
              Account data is retained until you delete your account or request deletion. Feedback data is retained
              according to the controller’s instructions and deleted upon their request or account deletion. Account
              deletion cascades removal of associated projects, forms, responses, and QR codes. Residual copies may
              remain in backups for up to 30 days.
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">5) Cookies</h2>
            <p>
              We only use strictly necessary cookies for authentication and security. Because these cookies are
              essential, no consent banner is required under EU rules.
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">6) Sharing &amp; subprocessors</h2>
            <p>
              We use the following service providers:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Vercel (hosting)</li>
              <li>Supabase (database/auth)</li>
              <li>Cloudflare (DNS/network)</li>
              <li>Google (Gmail support contact)</li>
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
            <h2 className="text-xl font-semibold text-gray-900">8) International transfers</h2>
            <p>
              Some providers may process data outside the EEA. When applicable, transfers are protected by standard
              contractual clauses (SCCs) or other lawful mechanisms.
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">9) Use of aggregated data</h2>
            <p>
              We may use aggregated or anonymized data to improve the Service.
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">10) Your rights</h2>
            <p>
              You may request access, correction, deletion, or export of your data. You can also lodge a complaint with
              your local data protection authority (Croatia: AZOP).
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">11) Security</h2>
            <p>
              We use technical and organizational measures to protect data, including access controls and encryption in
              transit.
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">12) Contact</h2>
            <p>
              Privacy questions: <a className="underline" href="mailto:privacy@bsp-lab.dev">privacy@bsp-lab.dev</a>.
            </p>
          </section>

          <section className="mt-10 space-y-3 text-gray-700">
            <h2 className="text-xl font-semibold text-gray-900">13) Related documents</h2>
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
