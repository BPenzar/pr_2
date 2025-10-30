'use client'

import { useState, useEffect } from 'react'
import { useCreateForm } from '@/hooks/use-forms'
import { useCreateFormFromTemplate } from '@/hooks/use-templates'
import { TemplateSelector } from '@/components/onboarding/template-selector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PencilIcon, FileTextIcon, XIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FormTemplate } from '@/lib/form-templates'

interface CreateFormModalProps {
  projectId: string
  onClose: () => void
  onSuccess?: (formId: string) => void
}

export function CreateFormModal({ projectId, onClose, onSuccess }: CreateFormModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [templateError, setTemplateError] = useState<string | null>(null)
  const [mode, setMode] = useState<'choice' | 'blank' | 'template'>('choice')

  const createForm = useCreateForm()
  const createFormFromTemplate = useCreateFormFromTemplate()

  const isSubmitting = createForm.isPending || createFormFromTemplate.isPending

  useEffect(() => {
    setFormError(null)
    setTemplateError(null)
  }, [mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setFormError(null)

    try {
      const form = await createForm.mutateAsync({
        projectId,
        name: name.trim(),
        description: description.trim() || undefined,
      })
      onSuccess?.(form.id)
      onClose()
    } catch (err: any) {
      setFormError(err.message)
    }
  }

  const handleTemplateSelect = async (template: FormTemplate) => {
    if (isSubmitting) return
    setTemplateError(null)
    try {
      const form = await createFormFromTemplate.mutateAsync({
        template,
        projectId,
      })
      onSuccess?.(form.id)
      onClose()
    } catch (err: any) {
      setTemplateError(err.message)
    }
  }

  if (mode === 'template') {
    return (
      <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
        <div className="sticky top-0 z-10 flex justify-end p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (!isSubmitting) onClose()
            }}
            disabled={isSubmitting}
          >
            <XIcon className="h-5 w-5" />
          </Button>
        </div>
        {templateError && (
          <div className="mx-auto mb-4 max-w-4xl px-4">
            <Alert variant="destructive">
              <AlertDescription>{templateError}</AlertDescription>
            </Alert>
          </div>
        )}
        <TemplateSelector
          onSelectTemplate={handleTemplateSelect}
          onBack={() => setMode('choice')}
          onSkip={() => setMode('blank')}
        />
        {isSubmitting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70">
            <Card>
              <CardContent className="px-6 py-4">
                <p className="text-sm text-gray-700">Creating form from template...</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card
        className={cn(
          'w-full mx-auto',
          mode === 'choice' ? 'max-w-2xl' : 'max-w-md'
        )}
      >
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {mode === 'choice' ? 'Create New Form' : 'Start from Scratch'}
              </CardTitle>
              <CardDescription>
                {mode === 'choice'
                  ? 'Choose how you would like to create your form.'
                  : 'Provide the basic details for your new form.'}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (!isSubmitting) onClose()
              }}
              disabled={isSubmitting}
            >
              <XIcon className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {mode === 'choice' ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Card
                role="button"
                tabIndex={0}
                onClick={() => setMode('blank')}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setMode('blank')
                  }
                }}
                className="border border-gray-200 hover:border-primary transition cursor-pointer"
              >
                <CardContent className="p-6 space-y-4">
                  <div className="rounded-full bg-blue-100 w-12 h-12 flex items-center justify-center text-blue-600">
                    <PencilIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Start from scratch</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Build a custom form by adding questions manually.
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card
                role="button"
                tabIndex={0}
                onClick={() => setMode('template')}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setMode('template')
                  }
                }}
                className="border border-gray-200 hover:border-primary transition cursor-pointer"
              >
                <CardContent className="p-6 space-y-4">
                  <div className="rounded-full bg-purple-100 w-12 h-12 flex items-center justify-center text-purple-600">
                    <FileTextIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Use a template</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Pick from our ready-made templates tailored for common use cases.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <Alert variant="destructive">
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Form Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Customer Satisfaction, Product Feedback"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of what this form is for..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSubmitting}
                  rows={3}
                />
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMode('choice')}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  className="flex-1"
                >
                  {isSubmitting ? 'Creating...' : 'Create Form'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
