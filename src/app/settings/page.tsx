'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '@/lib/supabase-client'
import Link from 'next/link'
import { ArrowLeftIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

type AlertMessage = { type: 'success' | 'error'; text: string } | null

export default function SettingsPage() {
  const router = useRouter()
  const { user, account, loading, signOut } = useAuth()
  const [accountName, setAccountName] = useState(account?.name || '')
  const [isUpdating, setIsUpdating] = useState(false)
  const [accountAlert, setAccountAlert] = useState<AlertMessage>(null)
  const [deleteAlert, setDeleteAlert] = useState<AlertMessage>(null)
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const accountId = account?.id ?? null

  useEffect(() => {
    if (typeof account?.name === 'string') {
      setAccountName(account.name)
    }
  }, [account?.name])

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accountId) {
      setAccountAlert({
        type: 'error',
        text: 'Account is still loading. Please try again in a moment.'
      })
      return
    }
    setIsUpdating(true)
    setAccountAlert(null)

    try {
      const { error } = await supabase
        .from('accounts')
        .update({ name: accountName.trim() })
        .eq('id', accountId)

      if (error) throw error

      setAccountAlert({ type: 'success', text: 'Account updated successfully' })
      // Refresh the route so auth context refetches account data
      router.refresh()
    } catch (error: any) {
      setAccountAlert({ type: 'error', text: error.message })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteAccount = useCallback(async () => {
    if (!accountId || confirmText !== 'DELETE' || isDeleting) return

    setIsDeleting(true)
    setDeleteAlert(null)

    try {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', accountId)

      if (error) throw error

      await signOut()
      router.replace('/')
    } catch (error: any) {
      console.error('Failed to delete account:', error)
      setDeleteAlert({
        type: 'error',
        text: error?.message || 'Unable to delete account right now. Please try again or contact support.'
      })
    } finally {
      setIsDeleting(false)
    }
  }, [accountId, confirmText, isDeleting, router, signOut])

  const currentPlan = useMemo(() => (account as any)?.plans, [account])
  const deleteDisabled = confirmText !== 'DELETE' || !accountId || isDeleting

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Update your account details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateAccount} className="space-y-4">
              {accountAlert && (
                <Alert variant={accountAlert.type === 'error' ? 'destructive' : 'default'}>
                  <AlertDescription>{accountAlert.text}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input
                    id="accountName"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    disabled={isUpdating}
                    placeholder="Enter account name"
                  />
                </div>
              </div>

              <Button type="submit" disabled={isUpdating || !accountName.trim()}>
                {isUpdating ? 'Updating...' : 'Update Account'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Plan Information */}
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>
              Your subscription details and usage limits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{currentPlan?.name || 'Free'} Plan</h3>
                  <p className="text-muted-foreground">
                    {currentPlan?.price === 0
                      ? 'Free forever'
                      : `$${(currentPlan?.price / 100).toFixed(2)}/month`
                    }
                  </p>
                </div>
                {currentPlan?.name === 'Free' && (
                  <Button>Upgrade Plan</Button>
                )}
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Plan Limits</h4>
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="flex justify-between">
                    <span>Projects:</span>
                    <span>{currentPlan?.max_projects === -1 ? 'Unlimited' : currentPlan?.max_projects}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Forms per project:</span>
                    <span>{currentPlan?.max_forms_per_project === -1 ? 'Unlimited' : currentPlan?.max_forms_per_project}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Responses per form:</span>
                    <span>{currentPlan?.max_responses_per_form === -1 ? 'Unlimited' : currentPlan?.max_responses_per_form}</span>
                  </div>
                </div>
              </div>

              {currentPlan?.features && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Features</h4>
                  <ul className="space-y-1">
                    {currentPlan.features.map((feature: string, index: number) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        • {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions that affect your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-900">Delete Account</h4>
                <p className="text-sm text-red-700 mt-1">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <div className="mt-4 space-y-3">
                  {deleteAlert && (
                    <Alert variant={deleteAlert.type === 'error' ? 'destructive' : 'default'}>
                      <AlertDescription>{deleteAlert.text}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="confirm-delete" className="text-sm text-red-800">
                      Type <span className="font-semibold">DELETE</span> to confirm
                    </Label>
                    <Input
                      id="confirm-delete"
                      value={confirmText}
                      onChange={(event) => setConfirmText(event.target.value.toUpperCase())}
                      placeholder="DELETE"
                      disabled={isDeleting}
                      aria-describedby="delete-instructions"
                    />
                    <p id="delete-instructions" className="text-xs text-muted-foreground">
                      This will sign you out and remove all projects, forms, and responses associated with your account.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    disabled={deleteDisabled}
                    onClick={handleDeleteAccount}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Account'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
