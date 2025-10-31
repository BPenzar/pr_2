'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '@/lib/supabase-client'
import Link from 'next/link'
import { ArrowLeftIcon, CreditCardIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { usePlanLimits, useAccountPlan } from '@/hooks/use-plans'

type AlertMessage = { type: 'success' | 'error'; text: string } | null

export default function SettingsPage() {
  const router = useRouter()
  const { user, account, loading, signOut, refreshAccount } = useAuth()
  const { data: accountPlanData } = useAccountPlan()
  const planLimits = usePlanLimits()
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
      const trimmed = accountName.trim()
      if (!trimmed) {
        setAccountAlert({ type: 'error', text: 'Account name cannot be empty.' })
        setIsUpdating(false)
        return
      }

      const { data, error } = await supabase
        .from('accounts')
        .update({ name: trimmed })
        .eq('id', accountId)
        .select()
        .single()

      if (error) throw error

      setAccountAlert({ type: 'success', text: 'Account updated successfully' })
      setAccountName(data.name)
      await refreshAccount()
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

  const currentPlan = accountPlanData?.plan ?? null
  const planUsage = accountPlanData?.usage

  const formatCurrency = (value?: number) => {
    if (!Number.isFinite(value ?? NaN)) return '€0'
    const amount = value ?? 0
    const hasFraction = Math.abs(amount % 1) > 0
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: hasFraction ? 2 : 0,
      maximumFractionDigits: hasFraction ? 2 : 0
    }).format(amount)
  }

  const formatFeatureLabel = (feature: string) => {
    return feature
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  }
  const deleteDisabled = confirmText !== 'DELETE' || !accountId || isDeleting
  const memberSince = account?.created_at
    ? new Date(account.created_at).toLocaleDateString()
    : '—'

  const formatUsage = (value: number, limit?: number | null) => {
    if (typeof limit !== 'number') {
      return `${value} / —`
    }
    if (limit === -1) {
      return `${value} / ∞`
    }
    return `${value} / ${limit}`
  }

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
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
              <p className="text-gray-600">Manage your profile, usage, and plan preferences</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <ArrowLeftIcon className="w-4 h-4" />
                  Back to Dashboard
                </Button>
              </Link>
              <Link href="/billing">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <CreditCardIcon className="w-4 h-4" />
                  Billing & Plans
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
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
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                Your subscription details and usage limits
              </CardDescription>
            </div>
            <Link href="/billing?tab=plans">
              <Button
                variant={currentPlan?.name === 'Free' ? 'default' : 'outline'}
                size="sm"
              >
                {currentPlan?.name === 'Free' ? 'Upgrade plan' : 'Manage plan'}
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{currentPlan?.name ?? 'Free'} plan</h3>
                  {currentPlan?.name && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {currentPlan?.name === 'Free'
                    ? 'Free forever'
                    : `${formatCurrency(currentPlan?.price_monthly)}/month`}
                </p>
                <p className="text-sm text-muted-foreground">
                  Member since {memberSince}
                </p>
              </div>

              {planLimits && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Current usage</h4>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg border border-slate-200 p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Projects</p>
                      <p className="text-lg font-semibold">{formatUsage(planLimits.projects.current, planLimits.projects.limit)}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Forms</p>
                      <p className="text-lg font-semibold">{formatUsage(planLimits.forms.current, planLimits.forms.limit)}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Responses this month</p>
                      <p className="text-lg font-semibold">{formatUsage(planLimits.responses.current, planLimits.responses.limit)}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">QR codes</p>
                      <p className="text-lg font-semibold">{formatUsage(planLimits.qrCodes.current, planLimits.qrCodes.limit)}</p>
                    </div>
                  </div>
                  {planUsage && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Usage resets monthly based on your active plan.
                    </p>
                  )}
                </div>
              )}

              {currentPlan?.features?.length ? (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Included features</h4>
                  <ul className="grid gap-2 md:grid-cols-2">
                    {currentPlan.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        {formatFeatureLabel(feature)}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
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
