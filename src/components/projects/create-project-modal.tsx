'use client'

import { useEffect, useState } from 'react'
import { useCreateProject } from '@/hooks/use-projects'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { SparklesIcon, PencilIcon, ArrowLeftIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase-client'

interface CreateProjectModalProps {
  onClose: () => void
  onSuccess?: () => void
}

export function CreateProjectModal({ onClose, onSuccess }: CreateProjectModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [serverCanCreate, setServerCanCreate] = useState(true)
  const [isCheckingLimit, setIsCheckingLimit] = useState(false)
  const [mode, setMode] = useState<'options' | 'manual'>('options')

  const router = useRouter()
  const { account } = useAuth()
  const createProject = useCreateProject()
  const canCreate = serverCanCreate

  useEffect(() => {
    if (!account?.id) return

    let cancelled = false

    const checkLimit = async () => {
      setIsCheckingLimit(true)
      try {
        const { data, error } = await supabase.rpc('can_create_project', { account_uuid: account.id })

        if (cancelled) return

        if (error) {
          console.error('Failed to check project capacity:', error)
          setServerCanCreate(false)
        } else {
          setServerCanCreate(Boolean(data))
        }
      } catch (rpcError) {
        if (!cancelled) {
          console.error('Failed to check project capacity:', rpcError)
          setServerCanCreate(false)
        }
      } finally {
        if (!cancelled) setIsCheckingLimit(false)
      }
    }

    checkLimit()

    return () => {
      cancelled = true
    }
  }, [account?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      await createProject.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
      })
      onSuccess?.()
      onClose()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleGuidedSetup = () => {
    if (!canCreate) return
    onClose()
    router.push('/onboarding?from=guided-setup')
  }

  if (mode === 'options') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle>Start a New Project</CardTitle>
            <CardDescription>
              Choose how you want to set things up.
            </CardDescription>
            {!canCreate && !isCheckingLimit && (
              <Alert className="mt-3">
                <AlertDescription>
                  You&apos;ve reached the project limit. Remove a project to create a new one.
                </AlertDescription>
              </Alert>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleGuidedSetup}
              disabled={!canCreate || isCheckingLimit}
              className="w-full justify-start"
            >
              <SparklesIcon className="h-4 w-4 mr-2" />
              Guided setup (Project → Form → Template)
            </Button>
            <Button
              variant="outline"
              onClick={() => setMode('manual')}
              disabled={!canCreate || isCheckingLimit}
              className="w-full justify-start"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Start from scratch
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={onClose}>
              Cancel
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Create New Project</CardTitle>
          <CardDescription>
            Create a project to organize your feedback forms
          </CardDescription>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 w-fit -ml-2"
            onClick={() => setMode('options')}
            disabled={createProject.isPending}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to options
          </Button>
          {!canCreate && !isCheckingLimit && (
            <Alert className="mt-3">
              <AlertDescription>
                You&apos;ve reached the project limit. Remove a project to create a new one.
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                placeholder="e.g., Restaurant Feedback, Website Survey"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={createProject.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of what this project is for..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={createProject.isPending}
                rows={3}
              />
            </div>

            <div className="flex space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createProject.isPending}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!canCreate || createProject.isPending || !name.trim() || isCheckingLimit}
                className="flex-1"
              >
                {createProject.isPending ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
