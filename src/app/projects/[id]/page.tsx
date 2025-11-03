'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { useProject } from '@/hooks/use-projects'
import { useDeleteForm } from '@/hooks/use-forms'
import { usePlanLimits } from '@/hooks/use-plans'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateFormModal } from '@/components/forms/create-form-modal'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  PlusIcon,
  FileTextIcon,
  MessageSquareIcon,
  QrCodeIcon,
  SettingsIcon,
  TrashIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  TrendingUpIcon,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const [showCreateFormModal, setShowCreateFormModal] = useState(false)
  const { data: project, isLoading, error } = useProject(projectId)
  const deleteForm = useDeleteForm()
  const [confirmFormId, setConfirmFormId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const planLimits = usePlanLimits()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading project...</div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Project not found</h2>
          <p className="text-gray-600 mb-4">
            The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  const totalResponses =
    project.forms?.reduce(
      (sum: number, form: any) => sum + (form.responses?.[0]?.count || 0),
      0
    ) || 0

  const totalQrCodes =
    project.forms?.reduce(
      (sum: number, form: any) => sum + (form.qr_codes?.[0]?.count || 0),
      0
    ) || 0

  const formsUsage = planLimits?.forms
  const formsLimit = formsUsage?.limit ?? null
  const formsCount = project.forms?.length ?? formsUsage?.current ?? 0
  const reachedFormsLimit =
    formsLimit !== null &&
    formsLimit !== -1 &&
    formsCount >= formsLimit

  const handleFormCreated = async (formId: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['project', projectId] }),
      queryClient.invalidateQueries({ queryKey: ['forms', projectId] }),
    ])
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 py-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <p className="text-gray-600">{project.description || 'No description'}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard">
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/projects/${projectId}/settings`}>
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  Project Settings
                </Link>
              </Button>
              {reachedFormsLimit ? (
                <Link href="/billing">
                  <Button
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-600 text-white border-none"
                  >
                    <TrendingUpIcon className="w-4 h-4 mr-2" />
                    Upgrade Plan
                  </Button>
                </Link>
              ) : (
                <Button size="sm" onClick={() => setShowCreateFormModal(true)}>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  New Form
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Project Stats */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Forms</CardTitle>
              <FileTextIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{project.forms?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Active forms in this project
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Responses</CardTitle>
              <MessageSquareIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalResponses}</div>
              <p className="text-xs text-muted-foreground">
                Total feedback received
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">QR Codes</CardTitle>
              <QrCodeIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalQrCodes}</div>
              <p className="text-xs text-muted-foreground">
                Generated QR codes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Forms List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Forms</CardTitle>
                <CardDescription>
                  Manage your feedback forms for this project
                </CardDescription>
              </div>
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <Button onClick={() => setShowCreateFormModal(true)} disabled={reachedFormsLimit}>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create Form
                </Button>
                {reachedFormsLimit && (
                  <p className="text-xs text-orange-600 sm:text-right">
                    You&apos;ve reached your forms limit. Upgrade to add more.
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!project.forms || project.forms.length === 0 ? (
              <div className="text-center py-12">
                <FileTextIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No forms yet</h3>
                <p className="text-gray-600 mb-6">
                  Create your first form to start collecting feedback for this project
                </p>
                <Button onClick={() => setShowCreateFormModal(true)} disabled={reachedFormsLimit}>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create Your First Form
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {project.forms?.map((form: any) => {
                  const responsesCount = form.responses?.[0]?.count ?? 0
                  const qrCodesCount = form.qr_codes?.[0]?.count ?? 0
                  const createdLabel = form.created_at
                    ? `${formatDistanceToNow(new Date(form.created_at))} ago`
                    : '—'
                  const updatedLabel = form.updated_at
                    ? `${formatDistanceToNow(new Date(form.updated_at))} ago`
                    : '—'
                  const isActive = form.is_active !== false
                  const statusLabel = isActive ? 'Active' : 'Inactive'
                  const statusClass = isActive ? 'text-green-600 bg-green-50' : 'text-orange-600 bg-orange-50'
                  const StatusIcon = isActive ? CheckCircle2Icon : AlertTriangleIcon
                  const statusIconClass = isActive ? 'text-green-500' : 'text-orange-500'
                  const handleOpen = () => router.push(`/forms/${form.id}`)

                  return (
                    <Card
                      key={form.id}
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
                              <FileTextIcon className="w-5 h-5 text-blue-600" />
                              {form.name}
                            </CardTitle>
                            <CardDescription className="text-sm text-muted-foreground">
                              {form.description ||
                                'Add a brief description so teammates know what this form captures.'}
                            </CardDescription>
                          </div>
                          <StatusIcon className={`h-5 w-5 flex-shrink-0 ${statusIconClass}`} aria-hidden="true" />
                        </div>
                        <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </CardHeader>
                      <CardContent className="flex flex-1 flex-col justify-between gap-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Responses</p>
                            <p className="text-base font-semibold text-slate-900">{responsesCount}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">QR Codes</p>
                            <p className="text-base font-semibold text-slate-900">{qrCodesCount}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Created</p>
                            <p className="text-sm font-medium text-slate-700">{createdLabel}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Last Updated</p>
                            <p className="text-sm font-medium text-slate-700">{updatedLabel}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                          {confirmFormId === form.id ? (
                            <>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={async (event) => {
                                  event.stopPropagation()
                                  try {
                                    await deleteForm.mutateAsync({ formId: form.id, projectId })
                                  } catch (err) {
                                    console.error('Failed to delete form:', err)
                                  } finally {
                                    setConfirmFormId(null)
                                  }
                                }}
                                disabled={deleteForm.isPending}
                              >
                                Confirm delete
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  setConfirmFormId(null)
                                }}
                                disabled={deleteForm.isPending}
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={(event) => {
                                event.stopPropagation()
                                setConfirmFormId(form.id)
                              }}
                              disabled={deleteForm.isPending}
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        {confirmFormId === form.id && (
                          <p className="text-xs text-red-600">
                            Deleting removes this form and all associated data. This cannot be undone.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {showCreateFormModal && (
        <CreateFormModal
          projectId={projectId}
          onClose={() => setShowCreateFormModal(false)}
          onSuccess={handleFormCreated}
        />
      )}
    </div>
  )
}
