'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

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
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center min-h-screen text-center">
            <div className="max-w-3xl">
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                BSP Feedback Tool
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Collect feedback through QR codes and web widgets.
                Perfect for restaurants, stores, websites, and any business that values customer feedback.
              </p>
              <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
                <Link href="/auth/signup">
                  <Button size="lg" className="w-full sm:w-auto">
                    Get Started Free
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="py-12">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold mb-2">QR Code Feedback</h3>
                  <p className="text-gray-600">
                    Generate QR codes for physical locations. Customers scan and leave feedback instantly.
                  </p>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold mb-2">Web Widgets</h3>
                  <p className="text-gray-600">
                    Embed feedback forms directly on your website for seamless user experience.
                  </p>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
                  <p className="text-gray-600">
                    View detailed analytics, export data, and track feedback trends over time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return null
}