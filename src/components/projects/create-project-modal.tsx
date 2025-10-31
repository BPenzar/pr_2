'use client'

import { useEffect, useState } from 'react'
import { useCreateProject } from '@/hooks/use-projects'
import { useCanPerformAction } from '@/hooks/use-plans'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { UpgradePrompt } from '@/components/upgrade/upgrade-prompt'
import { CrownIcon, SparklesIcon, PencilIcon, ArrowLeftIcon } from 'lucide-react'
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
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [serverCanCreate, setServerCanCreate] = useState(true)
  const [isCheckingLimit, setIsCheckingLimit] = useState(false)
  const [mode, setMode] = useState<'options' | 'manual'>('options')

  const router = useRouter()
  const { account } = useAuth()
  const createProject = useCreateProject()
  const { canCreateProject, getRemainingQuota } = useCanPerformAction()

  const allowedByPlan = canCreateProject()
  const remainingProjects = getRemainingQuota('projects')
  const canCreate = allowedByPlan && serverCanCreate

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

    if (!canCreate) {
      setShowUpgradePrompt(true)
      return
    }

    try {
      await createProject.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
      })
      onSuccess?.()
      onClose()
    } catch (err: any) {
      if (err.message.includes('limit')) {
        setShowUpgradePrompt(true)
      } else {
        setError(err.message)
      }
    }
  }

  const handleUpgrade = () => {
    router.push('/billing')
    onClose()
  }

  const handleGuidedSetup = () => {
    if (!canCreate) {
      setShowUpgradePrompt(true)
      return
    }
    onClose()
    router.push('/onboarding')
  }

  if (showUpgradePrompt) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="w-full max-w-lg mx-4">
          <UpgradePrompt
            feature="projects"
            currentLimit={remainingProjects === Infinity ? 3 : 3 - remainingProjects}
            upgradeLimit={-1}
            onUpgrade={handleUpgrade}
            onDismiss={() => setShowUpgradePrompt(false)}
          />
        </div>
      </div>
    )
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
                <CrownIcon className="h-4 w-4" />
                <AlertDescription>
                  You&apos;ve reached your project limit. Upgrade to create more projects.
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
              <CrownIcon className="h-4 w-4" />
              <AlertDescription>
                You&apos;ve reached your project limit. Upgrade to Pro for unlimited projects.
              </AlertDescription>
            </Alert>
          )}
          {canCreate && remainingProjects !== Infinity && remainingProjects <= 1 && (
            <Alert className="mt-3 border-orange-200 bg-orange-50">
              <CrownIcon className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                You have {remainingProjects} project{remainingProjects !== 1 ? 's' : ''} remaining.
                Consider upgrading for unlimited projects.
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
              {!canCreate ? (
                <Button
                  type="button"
                  onClick={() => setShowUpgradePrompt(true)}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  <CrownIcon className="h-4 w-4 mr-2" />
                  Upgrade to Create
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={createProject.isPending || !name.trim() || isCheckingLimit}
                  className="flex-1"
                >
                  {createProject.isPending ? 'Creating...' : 'Create Project'}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
