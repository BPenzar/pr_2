'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useProjects } from '@/hooks/use-projects'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ProjectList } from '@/components/projects/project-list'
import { SettingsIcon, TrendingUpIcon, SparklesIcon, Menu, X } from 'lucide-react'
import { checkOnboardingStatus } from '@/lib/onboarding'
import Link from 'next/link'
import { supabase } from '@/lib/supabase-client'
import { usePlanLimits } from '@/hooks/use-plans'

export default function DashboardPage() {
  const router = useRouter()
  const { user, account, signOut, loading } = useAuth()
  const { data: projects } = useProjects()
  const planLimits = usePlanLimits()
  const [hasCreateAccess, setHasCreateAccess] = useState(true)
  const [onboardingChecked, setOnboardingChecked] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false)

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
      setMobileActionsOpen(false)
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
    setMobileActionsOpen(false)
    const { error } = await signOut()
    if (error) {
      console.error('Failed to sign out:', error)
      return
    }
    router.replace('/')
  }

  const formatLimit = (limit?: number | null) => {
    if (typeof limit !== 'number') return '—'
    return limit === -1 ? 'Unlimited' : limit
  }

  const projectUsage = planLimits?.projects
  const projectsCount = projectUsage?.current ?? projects?.length ?? 0
  const projectLimitValue = projectUsage?.limit ?? null
  const projectLimitLabel =
    projectLimitValue === null
      ? '—'
      : projectLimitValue === -1
      ? 'Unlimited'
      : projectLimitValue
  const reachedProjectLimit =
    projectLimitValue !== null &&
    projectLimitValue !== -1 &&
    projectsCount >= projectLimitValue
  const canCreateProject = hasCreateAccess && !reachedProjectLimit

  const handleCreateProjectClick = () => {
    setMobileActionsOpen(false)
    if (!canCreateProject) {
      setShowCreateModal(false)
      return
    }
    setShowCreateModal(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Account email: {user?.email}
                </p>
              </div>
              <div className="flex items-center justify-end gap-3">
                <div className="hidden sm:flex items-center gap-3">
                  <Link href="/billing" className="self-center">
                    <Button
                      variant={reachedProjectLimit ? 'default' : 'outline'}
                      size="sm"
                      className={`h-9 items-center ${reachedProjectLimit ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}`}
                    >
                      <TrendingUpIcon className="w-4 h-4 mr-2" />
                      {reachedProjectLimit ? 'Upgrade plan' : 'Your Plan'}
                    </Button>
                  </Link>
                  <Link href="/settings" className="self-center">
                    <Button variant="outline" size="sm" className="h-9 items-center">
                      <SettingsIcon className="w-4 h-4 mr-2" />
                      Account Settings
                    </Button>
                  </Link>
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    size="sm"
                    className="h-9 items-center border-slate-300 text-slate-700 hover:bg-slate-100"
                  >
                    Sign Out
                  </Button>
                </div>
                <div className="relative sm:hidden">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMobileActionsOpen((prev) => !prev)}
                    aria-label="Toggle account menu"
                  >
                    {mobileActionsOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                  </Button>
                  {mobileActionsOpen && (
                    <div className="absolute right-0 z-10 mt-2 w-48 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
                      <Link href="/billing" onClick={() => setMobileActionsOpen(false)}>
                        <Button variant="ghost" size="sm" className="w-full justify-start">
                          <TrendingUpIcon className="w-4 h-4 mr-2" />
                          Your Plan
                        </Button>
                      </Link>
                      <Link href="/settings" onClick={() => setMobileActionsOpen(false)}>
                        <Button variant="ghost" size="sm" className="w-full justify-start">
                          <SettingsIcon className="w-4 h-4 mr-2" />
                          Account Settings
                        </Button>
                      </Link>
                      <Button
                        onClick={handleSignOut}
                        variant="outline"
                        size="sm"
                        className="mt-1 w-full justify-start border-slate-300 text-slate-700 hover:bg-slate-100"
                      >
                        Sign Out
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {!canCreateProject && reachedProjectLimit && null}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">Projects</CardTitle>
              <div className="text-2xl font-semibold text-slate-900">{projectsCount}</div>
              <CardDescription>Active projects</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">Forms</CardTitle>
              <div className="text-2xl font-semibold text-slate-900">{planLimits?.forms.current ?? 0}</div>
              <CardDescription>Across all projects</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">Responses</CardTitle>
              <div className="text-2xl font-semibold text-slate-900">{planLimits?.responses.current ?? 0}</div>
              <CardDescription>This month</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">QR Codes</CardTitle>
              <div className="text-2xl font-semibold text-slate-900">{planLimits?.qrCodes.current ?? 0}</div>
              <CardDescription>Generated to date</CardDescription>
            </CardHeader>
          </Card>
        </div>
        <ProjectList
          canCreateProject={canCreateProject}
          projectsCount={projectsCount}
          reachedProjectLimit={reachedProjectLimit}
          showCreateModal={showCreateModal}
          onShowCreateModalChange={setShowCreateModal}
        />
      </div>
    </div>
  )
}
