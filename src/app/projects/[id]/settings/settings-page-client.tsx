'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useProject, useUpdateProject, useDeleteProject } from '@/hooks/use-projects'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { ArrowLeftIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

type AlertMessage = { type: 'success' | 'error'; text: string } | null

interface ProjectSettingsPageClientProps {
  projectId: string
}

export function ProjectSettingsPageClient({ projectId }: ProjectSettingsPageClientProps) {
  const router = useRouter()
  const { data: project, isLoading, error } = useProject(projectId)
  const updateProject = useUpdateProject()
  const deleteProject = useDeleteProject()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [updateAlert, setUpdateAlert] = useState<AlertMessage>(null)
  const [deleteAlert, setDeleteAlert] = useState<AlertMessage>(null)
  const [confirmText, setConfirmText] = useState('')

  useEffect(() => {
    if (project) {
      setName(project.name ?? '')
      setDescription(project.description ?? '')
    }
  }, [project])

  const isDirty = useMemo(() => {
    if (!project) return false
    const currentName = (project.name ?? '').trim()
    const currentDescription = (project.description ?? '').trim()
    return name.trim() !== currentName || description.trim() !== currentDescription
  }, [description, name, project])

  const handleUpdate = useCallback(async (event: React.FormEvent) => {
    event.preventDefault()
    if (!project) return

    setUpdateAlert(null)

    try {
      const trimmedName = name.trim()
      const trimmedDescription = description.trim()
      const normalizedDescription = trimmedDescription === '' ? null : trimmedDescription
      await updateProject.mutateAsync({
        id: project.id,
        name: trimmedName,
        description: normalizedDescription,
      })
      setName(trimmedName)
      setDescription(normalizedDescription ?? '')
      setUpdateAlert({ type: 'success', text: 'Project details updated' })
    } catch (err: any) {
      setUpdateAlert({ type: 'error', text: err?.message || 'Unable to update project right now.' })
    }
  }, [description, name, project, updateProject])

  const handleDelete = useCallback(async () => {
    if (!project?.id || confirmText !== 'DELETE') return

    setDeleteAlert(null)

    try {
      await deleteProject.mutateAsync(project.id)
      router.replace('/dashboard')
    } catch (err: any) {
      setDeleteAlert({ type: 'error', text: err?.message || 'Failed to delete project. Please try again.' })
    }
  }, [confirmText, deleteProject, project?.id, router])

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
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">Project not found</h2>
          <p className="text-sm text-muted-foreground">
            The project may have been deleted or you no longer have access.
          </p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  const deleteDisabled = confirmText !== 'DELETE' || deleteProject.isPending

  const createdAgo = project.created_at
    ? `${formatDistanceToNow(new Date(project.created_at))} ago`
    : '—'
  const updatedAgo = project.updated_at
    ? `${formatDistanceToNow(new Date(project.updated_at))} ago`
    : '—'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 py-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Project Settings</h1>
              <p className="text-sm text-muted-foreground">
                Update details or remove this project. Changes apply immediately.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/projects/${projectId}`}>
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Back to Project
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>Edit how this project appears across your workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleUpdate}>
              {updateAlert && (
                <Alert variant={updateAlert.type === 'error' ? 'destructive' : 'default'}>
                  <AlertDescription>{updateAlert.text}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Project name"
                  disabled={updateProject.isPending}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-description">Description</Label>
                <Textarea
                  id="project-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe the goal for this project (optional)"
                  rows={4}
                  disabled={updateProject.isPending}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={!isDirty || updateProject.isPending}>
                  {updateProject.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
            <CardDescription>Track when this project was created and last changed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-sm font-medium">Created</Label>
                <p className="text-sm text-muted-foreground">{createdAgo}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Last Updated</Label>
                <p className="text-sm text-muted-foreground">{updatedAgo}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>Deleting a project removes all forms and responses.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
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
                  disabled={deleteProject.isPending}
                  aria-describedby="project-delete-hint"
                />
                <p id="project-delete-hint" className="text-xs text-muted-foreground">
                  This action cannot be undone and will free up a project slot.
                </p>
              </div>
              <Button
                variant="destructive"
                disabled={deleteDisabled}
                onClick={handleDelete}
              >
                {deleteProject.isPending ? 'Deleting...' : 'Delete Project'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
