'use client'

import { useState } from 'react'
import { useProjects, useDeleteProject } from '@/hooks/use-projects'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateProjectModal } from './create-project-modal'
import { PlusIcon, FolderIcon, TrashIcon, ArrowRightIcon, CheckCircle2Icon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'

interface ProjectListProps {
  canCreateProject: boolean
  projectsCount: number
  reachedProjectLimit: boolean
  showCreateModal?: boolean
  onShowCreateModalChange?: (open: boolean) => void
}

export function ProjectList({
  canCreateProject,
  projectsCount,
  reachedProjectLimit,
  showCreateModal: controlledShowCreateModal,
  onShowCreateModalChange,
}: ProjectListProps) {
  const [internalShowCreateModal, setInternalShowCreateModal] = useState(false)
  const { data: projects, isLoading, error } = useProjects()
  const deleteProject = useDeleteProject()
  const router = useRouter()
  const [confirmProjectId, setConfirmProjectId] = useState<string | null>(null)

  const isControlled = typeof controlledShowCreateModal === 'boolean'
  const modalOpen = isControlled ? controlledShowCreateModal! : internalShowCreateModal
  const setModalOpen = (open: boolean) => {
    if (isControlled) {
      onShowCreateModalChange?.(open)
    } else {
      setInternalShowCreateModal(open)
    }
  }

  const hasProjects = (projects?.length ?? 0) > 0

  if (isLoading) {
    return (
      <div className="">
        <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading projects: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold text-slate-900">Projects</h2>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <Button
            onClick={() => canCreateProject && setModalOpen(true)}
            disabled={!canCreateProject}
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Project
          </Button>
          {!canCreateProject && reachedProjectLimit && (
            <p className="text-xs text-orange-600 sm:text-right">
              You&apos;ve reached your project limit. Upgrade to add more.
            </p>
          )}
        </div>
      </div>
      {hasProjects ? (
        <div className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects?.map((project) => {
            const handleOpen = () => router.push(`/projects/${project.id}`)
            const formsCount = project.usage?.forms_count ?? 0
            const qrCodesCount = project.usage?.qr_codes_count ?? 0
            const createdLabel = project.created_at
              ? `${formatDistanceToNow(new Date(project.created_at))} ago`
              : '—'
            const isActive = project.is_active !== false
            const statusLabel = isActive ? 'Active' : 'Inactive'
            const statusClass = isActive ? 'text-green-600 bg-green-50' : 'text-orange-600 bg-orange-50'

            return (
              <Card
                key={project.id}
                role="button"
                tabIndex={0}
                onClick={handleOpen}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    handleOpen()
                  }
                }}
                className="flex h-full flex-col border border-slate-200 bg-white transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <CardHeader className="pb-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                        <FolderIcon className="w-5 h-5 text-blue-600" />
                        {project.name}
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        {project.description || 'Add a brief description so teammates know what this project covers.'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(event) => {
                          event.stopPropagation()
                          event.preventDefault()
                          handleOpen()
                        }}
                        aria-label={`Open ${project.name}`}
                      >
                        <ArrowRightIcon className="h-4 w-4" />
                      </Button>
                      {confirmProjectId === project.id ? (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={async (event) => {
                              event.stopPropagation()
                              event.preventDefault()
                              try {
                                await deleteProject.mutateAsync(project.id)
                              } catch (err) {
                                console.error('Failed to delete project:', err)
                              } finally {
                                setConfirmProjectId(null)
                              }
                            }}
                            disabled={deleteProject.isPending}
                          >
                            Confirm delete
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation()
                              event.preventDefault()
                              setConfirmProjectId(null)
                            }}
                            disabled={deleteProject.isPending}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-700"
                          onClick={(event) => {
                            event.stopPropagation()
                            event.preventDefault()
                            setConfirmProjectId(project.id)
                          }}
                          aria-label={`Delete ${project.name}`}
                          disabled={deleteProject.isPending}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium ${statusClass}`}>
                    {statusLabel}
                  </span>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Forms</p>
                      <p className="text-base font-semibold text-slate-900">{formsCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Responses</p>
                      <p className="text-base font-semibold text-slate-900">—</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">QR Codes</p>
                      <p className="text-base font-semibold text-slate-900">{qrCodesCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="text-sm font-medium text-slate-700">{createdLabel}</p>
                    </div>
                  </div>
                  {confirmProjectId === project.id && (
                    <p className="text-xs text-red-600">
                      Deleting removes this project and all related forms, QR codes, and responses permanently.
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <FolderIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first project to start collecting feedback
          </p>
          <Button
            onClick={() => canCreateProject && setModalOpen(true)}
            disabled={!canCreateProject}
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Create Your First Project
          </Button>
          {!canCreateProject && reachedProjectLimit && (
            <p className="mt-3 text-sm text-orange-600">
              You&apos;ve reached your project limit. Upgrade to add more.
            </p>
          )}
        </div>
      )}

      {modalOpen && (
        <CreateProjectModal
          onClose={() => setModalOpen(false)}
          onSuccess={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}
