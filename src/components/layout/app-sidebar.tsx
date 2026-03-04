'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase-client'
import { useAuth } from '@/contexts/auth-context'
import { useProjects } from '@/hooks/use-projects'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CreateProjectModal } from '@/components/projects/create-project-modal'
import { CreateFormModal } from '@/components/forms/create-form-modal'
import { FolderIcon, FileTextIcon, PlusIcon, SettingsIcon, LayoutDashboardIcon, LogOutIcon, ChevronDownIcon, ChevronRightIcon } from 'lucide-react'

type FormListItem = {
  id: string
  name: string
  updated_at?: string | null
  created_at?: string | null
}

const LAST_OPENED_FORM_ID_KEY = 'lastOpenedFormId'

function parseCurrentIds(pathname: string) {
  const formMatch = pathname.match(/^\/forms\/([^/]+)/)
  const projectMatch = pathname.match(/^\/projects\/([^/]+)/)
  return {
    currentFormId: formMatch?.[1] ?? null,
    currentProjectId: projectMatch?.[1] ?? null,
  }
}

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, account, signOut, authLoading } = useAuth()
  const { data: projects, isLoading: projectsLoading } = useProjects()

  const { currentFormId, currentProjectId } = useMemo(() => parseCurrentIds(pathname), [pathname])

  const ownedProjectIds = useMemo(() => (projects ?? []).map((project) => project.id), [projects])

  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null)
  const [createProjectOpen, setCreateProjectOpen] = useState(false)
  const [createFormProjectId, setCreateFormProjectId] = useState<string | null>(null)

  const { data: activeFormProjectId } = useQuery({
    queryKey: ['sidebar-form-project', currentFormId, account?.id, ownedProjectIds.join(',')],
    queryFn: async () => {
      if (!currentFormId || !account?.id) return null
      if (ownedProjectIds.length === 0) return null

      const { data, error } = await supabase
        .from('forms')
        .select('project_id')
        .eq('id', currentFormId)
        .in('project_id', ownedProjectIds)
        .maybeSingle()

      if (error) throw error
      return (data as { project_id: string } | null)?.project_id ?? null
    },
    enabled: !!currentFormId && !!account?.id && ownedProjectIds.length > 0,
    staleTime: 30 * 1000,
  })

  useEffect(() => {
    if (currentProjectId) {
      setExpandedProjectId(currentProjectId)
      return
    }
    if (activeFormProjectId) {
      setExpandedProjectId(activeFormProjectId)
    }
  }, [activeFormProjectId, currentProjectId])

  const { data: expandedForms, isLoading: formsLoading } = useQuery({
    queryKey: ['sidebar-project-forms', expandedProjectId, account?.id],
    queryFn: async () => {
      if (!expandedProjectId) return []
      const { data, error } = await supabase
        .from('forms')
        .select('id, name, updated_at, created_at')
        .eq('project_id', expandedProjectId)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data ?? []) as FormListItem[]
    },
    enabled: !!expandedProjectId && !!account?.id,
  })

  const handleToggleProject = (projectId: string) => {
    setExpandedProjectId((prev) => (prev === projectId ? null : projectId))
  }

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (error) {
      console.warn('Sign out reported an error but session was cleared locally.', error)
    }
    router.replace('/auth/login')
  }

  const handleOpenForm = (formId: string) => {
    try {
      window.localStorage.setItem(LAST_OPENED_FORM_ID_KEY, formId)
    } catch {
      // ignore
    }
    router.push(`/forms/${formId}`)
  }

  return (
    <aside className="hidden w-80 shrink-0 border-r border-slate-200 bg-white md:block">
      <div className="flex h-full flex-col">
        <div className="border-b border-slate-200 px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-900">Projects</div>
              <div className="truncate text-xs text-muted-foreground">
                {user?.email ?? '—'}
              </div>
            </div>
            <Button size="sm" onClick={() => setCreateProjectOpen(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              New
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3">
          {projectsLoading ? (
            <div className="space-y-2 px-2">
              <div className="h-9 rounded bg-slate-100" />
              <div className="h-9 rounded bg-slate-100" />
              <div className="h-9 rounded bg-slate-100" />
            </div>
          ) : (projects?.length ?? 0) === 0 ? (
            <div className="px-2 py-6 text-sm text-muted-foreground">
              No projects yet. Create one to add forms.
            </div>
          ) : (
            <div className="space-y-1">
              {(projects ?? []).map((project) => {
                const isExpanded = expandedProjectId === project.id
                const isActiveProject = currentProjectId === project.id || activeFormProjectId === project.id
                return (
                  <div key={project.id} className="rounded-md">
                    <div
                      className={cn(
                        'flex items-center justify-between gap-2 rounded-md px-2 py-2 text-sm',
                        isActiveProject ? 'bg-slate-100' : 'hover:bg-slate-50'
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleProject(project.id)}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? (
                          <ChevronDownIcon className="h-4 w-4 text-slate-500" />
                        ) : (
                          <ChevronRightIcon className="h-4 w-4 text-slate-500" />
                        )}
                        <FolderIcon className="h-4 w-4 text-blue-600" />
                        <span className="truncate">{project.name}</span>
                      </button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setCreateFormProjectId(project.id)}
                        aria-label={`Create form in ${project.name}`}
                      >
                        <PlusIcon className="h-4 w-4" />
                      </Button>
                    </div>

                    {isExpanded && (
                      <div className="ml-7 mt-1 space-y-1 border-l border-slate-200 pl-3">
                        {formsLoading ? (
                          <div className="space-y-2 py-2">
                            <div className="h-8 rounded bg-slate-100" />
                            <div className="h-8 rounded bg-slate-100" />
                          </div>
                        ) : (expandedForms?.length ?? 0) === 0 ? (
                          <div className="py-2 text-xs text-muted-foreground">
                            No forms yet.
                          </div>
                        ) : (
                          (expandedForms ?? []).map((form) => {
                            const isActiveForm = currentFormId === form.id
                            return (
                              <button
                                key={form.id}
                                type="button"
                                onClick={() => handleOpenForm(form.id)}
                                className={cn(
                                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm',
                                  isActiveForm ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-slate-50'
                                )}
                              >
                                <FileTextIcon className={cn('h-4 w-4', isActiveForm ? 'text-emerald-700' : 'text-slate-500')} />
                                <span className="truncate">{form.name}</span>
                              </button>
                            )
                          })
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 p-3 space-y-2">
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/dashboard">
              <LayoutDashboardIcon className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/settings">
              <SettingsIcon className="h-4 w-4 mr-2" />
              Account settings
            </Link>
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleSignOut}
            disabled={authLoading}
          >
            <LogOutIcon className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
      </div>

      {createProjectOpen && (
        <CreateProjectModal
          onClose={() => setCreateProjectOpen(false)}
          onSuccess={() => {
            setCreateProjectOpen(false)
            queryClient.invalidateQueries({ queryKey: ['projects'] })
          }}
        />
      )}

      {createFormProjectId && (
        <CreateFormModal
          projectId={createFormProjectId}
          onClose={() => setCreateFormProjectId(null)}
          onSuccess={(formId) => {
            setCreateFormProjectId(null)
            try {
              window.localStorage.setItem(LAST_OPENED_FORM_ID_KEY, formId)
            } catch {
              // ignore
            }
            queryClient.invalidateQueries({ queryKey: ['forms', createFormProjectId] })
            router.push(`/forms/${formId}`)
          }}
        />
      )}
    </aside>
  )
}

