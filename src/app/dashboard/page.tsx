'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useProjects } from '@/hooks/use-projects'
import { useAccountAnalytics } from '@/hooks/use-responses'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProjectList } from '@/components/projects/project-list'
import { BarChart3Icon, FileTextIcon, MessageSquareIcon, QrCodeIcon, SettingsIcon, TrendingUpIcon, SparklesIcon } from 'lucide-react'
import { checkOnboardingStatus } from '@/lib/onboarding'
import Link from 'next/link'
import { supabase } from '@/lib/supabase-client'

export default function DashboardPage() {
  const router = useRouter()
  const { user, account, signOut, loading } = useAuth()
  const { data: projects } = useProjects()
  const { data: analytics } = useAccountAnalytics()
  const [hasCreateAccess, setHasCreateAccess] = useState(true)
  const [onboardingChecked, setOnboardingChecked] = useState(false)

  // Check if user needs onboarding
  useEffect(() => {
    async function checkOnboarding() {
      if (account?.id && !onboardingChecked) {
        const { needsOnboarding } = await checkOnboardingStatus(account!.id)
        if (needsOnboarding) {
          router.push('/onboarding')
          return
        }
        setOnboardingChecked(true)
      }
    }

    if (!loading && account) {
      checkOnboarding()
    }
  }, [account, loading, onboardingChecked, router])

  useEffect(() => {
    if (!account?.id) {
      setHasCreateAccess(false)
      return
    }

    const accountId = account.id

    async function checkProjectCapacity() {
      try {
        const { data: canCreate, error } = await supabase
          .rpc('can_create_project', { account_uuid: accountId })

        if (error) {
          console.error('Failed to check project capacity:', error)
          setHasCreateAccess(false)
        } else {
          setHasCreateAccess(Boolean(canCreate))
        }
      } catch (error) {
        console.error('Failed to check project capacity:', error)
        setHasCreateAccess(false)
      }
    }

    checkProjectCapacity()
  }, [account?.id, projects?.length])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (error) {
      console.error('Failed to sign out:', error)
      return
    }
    router.replace('/')
  }

  const stats = analytics?.totals || {
    projects: projects?.length || 0,
    forms: 0,
    responses: 0,
    qrCodes: 0,
    scans: 0,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.email}</p>
            </div>
            <div className="flex space-x-4">
              {!hasCreateAccess && (
                <Link href="/billing">
                  <Button variant="outline" size="sm">
                    <TrendingUpIcon className="w-4 h-4 mr-2" />
                    Upgrade for more projects
                  </Button>
                </Link>
              )}
              {hasCreateAccess && (
                <Link href="/onboarding">
                  <Button size="sm">
                    <SparklesIcon className="w-4 h-4 mr-2" />
                    Create New Form
                  </Button>
                </Link>
              )}
              <Link href="/billing">
                <Button variant="outline" size="sm">
                  <TrendingUpIcon className="w-4 h-4 mr-2" />
                  Billing
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="outline" size="sm">
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </Link>
              <Button onClick={handleSignOut} variant="outline" size="sm">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Quick Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projects</CardTitle>
              <BarChart3Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.projects}</div>
              <p className="text-xs text-muted-foreground">
                {stats.projects === 1 ? 'Active project' : 'Active projects'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Forms</CardTitle>
              <FileTextIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.forms}</div>
              <p className="text-xs text-muted-foreground">
                Across all projects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Responses</CardTitle>
              <MessageSquareIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.responses}</div>
              <p className="text-xs text-muted-foreground">
                Total feedback received
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">QR Scans</CardTitle>
              <QrCodeIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.scans}</div>
              <p className="text-xs text-muted-foreground">
                Total QR code scans
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details and current plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Account Name:</strong> {account?.name}</p>
              </div>
              <div className="space-y-2">
                <p><strong>Plan:</strong> {(account as any)?.plans?.name || 'Free'}</p>
                <p><strong>Member since:</strong> {new Date(account?.created_at || '').toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projects Section */}
        <ProjectList />
      </div>
    </div>
  )
}
