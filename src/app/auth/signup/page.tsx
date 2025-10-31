import { SignupForm } from '@/components/auth/signup-form'
import { Header } from '@/components/layout/Header'

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header showAuth={false} />

      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Business Feedback Tool
            </h1>
            <p className="text-gray-600">
              Create your free account and start collecting feedback
            </p>
          </div>
          <SignupForm />
        </div>
      </main>

    </div>
  )
}
