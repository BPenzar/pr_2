'use client'

import { useRouter } from 'next/navigation'
import { LogOutIcon } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'

export function HeaderSignOutButton() {
  const router = useRouter()
  const { signOut, authLoading } = useAuth()

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (error) {
      console.warn('Sign out reported an error but session was cleared locally.', error)
    }
    router.replace('/auth/login')
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleSignOut}
      disabled={authLoading}
    >
      <LogOutIcon className="h-4 w-4 mr-2" />
      Sign out
    </Button>
  )
}

