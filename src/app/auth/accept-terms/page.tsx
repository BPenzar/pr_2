import { Suspense } from 'react'
import { Header } from '@/components/layout/Header'
import { AcceptTermsForm } from '@/components/auth/accept-terms-form'

export default function AcceptTermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header showAuth={false} />

      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Feedback Collector
            </h1>
            <p className="text-gray-600">
              One last step before you get started
            </p>
          </div>
          <Suspense
            fallback={
              <div className="rounded-lg border border-border bg-white p-6 text-sm text-muted-foreground">
                Loading...
              </div>
            }
          >
            <AcceptTermsForm />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
