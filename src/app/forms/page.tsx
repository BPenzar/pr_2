'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateProjectModal } from '@/components/projects/create-project-modal'
import { CreateFormModal } from '@/components/forms/create-form-modal'

const LAST_OPENED_FORM_ID_KEY = 'lastOpenedFormId'

type OwnedProject = { id: string; name: string; description: string | null }

export default function FormsLandingPage() {
  const router = useRouter()
  const { user, account, loading, refreshAccount, signOut, authLoading } = useAuth()
  const [status, setStatus] = useState<'loading' | 'empty' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [projects, setProjects] = useState<OwnedProject[]>([])
  const [createProjectOpen, setCreateProjectOpen] = useState(false)
  const [createFormProjectId, setCreateFormProjectId] = useState<string | null>(null)

  const accountId = account?.id ?? null

  const hasProjects = projects.length > 0

  const projectIds = useMemo(() => projects.map((project) => project.id), [projects])

  useEffect(() => {
    if (loading) return
    if (!user || !accountId) return

    let cancelled = false

    const loadAndRedirect = async () => {
      setStatus('loading')
      setErrorMessage(null)

      const { data: ownedProjects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, description')
        .eq('account_id', accountId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (cancelled) return

      if (projectsError) {
        setErrorMessage(projectsError.message)
        setStatus('error')
        return
      }

      const normalizedProjects = (ownedProjects ?? []) as OwnedProject[]
      setProjects(normalizedProjects)

      const normalizedProjectIds = normalizedProjects.map((project) => project.id)
      if (normalizedProjectIds.length === 0) {
        setStatus('empty')
        return
      }

      const lastOpenedFormId = (() => {
        try {
          return window.localStorage.getItem(LAST_OPENED_FORM_ID_KEY)
        } catch {
          return null
        }
      })()

      if (lastOpenedFormId) {
        const { data: lastForm, error: lastFormError } = await supabase
          .from('forms')
          .select('id')
          .eq('id', lastOpenedFormId)
          .eq('is_active', true)
          .in('project_id', normalizedProjectIds)
          .maybeSingle()

        if (cancelled) return

        if (!lastFormError && lastForm?.id) {
          router.replace(`/forms/${lastForm.id}`)
          return
        }

        try {
          window.localStorage.removeItem(LAST_OPENED_FORM_ID_KEY)
        } catch {
          // ignore
        }
      }

      const { data: latestForms, error: latestFormError } = await supabase
        .from('forms')
        .select('id')
        .eq('is_active', true)
        .in('project_id', normalizedProjectIds)
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)

      if (cancelled) return

      if (latestFormError) {
        setErrorMessage(latestFormError.message)
        setStatus('error')
        return
      }

      const latestFormId = latestForms?.[0]?.id
      if (latestFormId) {
        router.replace(`/forms/${latestFormId}`)
        return
      }

      setStatus('empty')
    }

    loadAndRedirect()

    return () => {
      cancelled = true
    }
  }, [accountId, loading, router, user])

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Redirecting to sign in...</div>
      </div>
    )
  }

  if (!accountId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Finishing setup…</CardTitle>
            <CardDescription>
              We couldn&apos;t load your account details yet. This can happen right after sign-in or if the account record is missing.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                await refreshAccount()
                router.refresh()
              }}
              className="flex-1"
              disabled={authLoading}
            >
              Retry
            </Button>
            <Button
              onClick={async () => {
                await signOut()
                router.replace('/auth/login')
              }}
              className="flex-1"
              disabled={authLoading}
            >
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Unable to load your forms</CardTitle>
            <CardDescription>
              {errorMessage ?? 'Please try again.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.refresh()}
              className="flex-1"
            >
              Retry
            </Button>
            <Button
              onClick={() => router.replace('/settings')}
              className="flex-1"
            >
              Account Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const showNoProjects = !hasProjects

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>{showNoProjects ? 'Create your first project' : 'Create your first form'}</CardTitle>
          <CardDescription>
            {showNoProjects
              ? 'Projects group your feedback forms. Create one to get started.'
              : 'Pick a project and create a form to start collecting results.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showNoProjects ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button className="flex-1" onClick={() => setCreateProjectOpen(true)}>
                Create Project
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.push('/onboarding?from=guided-setup')}
              >
                Guided setup
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid gap-2">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between rounded-md border bg-white px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium text-slate-900">{project.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {project.description ?? '—'}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setCreateFormProjectId(project.id)}
                    >
                      Create form
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" className="flex-1" onClick={() => setCreateProjectOpen(true)}>
                  New project
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => router.push('/dashboard')}>
                  Open dashboard
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {createProjectOpen && (
        <CreateProjectModal
          onClose={() => setCreateProjectOpen(false)}
          onSuccess={() => {
            setCreateProjectOpen(false)
            router.refresh()
          }}
        />
      )}

      {createFormProjectId && (
        <CreateFormModal
          projectId={createFormProjectId}
          onClose={() => setCreateFormProjectId(null)}
          onSuccess={(formId) => {
            try {
              window.localStorage.setItem(LAST_OPENED_FORM_ID_KEY, formId)
            } catch {
              // ignore
            }
            router.replace(`/forms/${formId}`)
          }}
        />
      )}
    </div>
  )
}
