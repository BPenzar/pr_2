'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  showAuth?: boolean
}

export function Header({ showAuth = true }: HeaderProps) {
  const { user, signOut, loading, authLoading } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (error) {
      console.warn('Sign out reported an error but session was cleared locally.', error)
    }
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <header className="border-b bg-white/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="https://bsp-lab.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 hover:opacity-90 transition-opacity"
            >
              <Image
                src="/bsp-lab-logo.webp"
                alt="BSP Lab logo"
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover"
                priority
              />
              <span className="hidden text-sm font-semibold text-gray-900 sm:inline">
                BSP Lab
              </span>
            </Link>

            <span className="hidden h-8 w-px bg-gray-200 sm:inline" />
            <Link
              href="/"
              className="flex flex-col hover:text-primary transition-colors"
            >
              <span className="text-sm font-semibold text-gray-900">
                BSP Feedback
              </span>
              <span className="hidden text-xs text-gray-500 sm:inline">
                QR-powered feedback collection platform
              </span>
            </Link>
          </div>

          {showAuth && (
            <div className="flex items-center gap-2 sm:gap-4">
              {user ? (
                <>
                  <span className="hidden text-sm text-gray-600 sm:inline">
                    {user.email}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    disabled={loading || authLoading}
                    className="text-sm"
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button variant="ghost" size="sm" className="text-sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button size="sm" className="text-sm">
                      Sign Up (free)
                    </Button>
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
