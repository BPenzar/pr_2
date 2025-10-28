'use client'

import { useState } from 'react'
import { useCreateForm } from '@/hooks/use-forms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface CreateFormModalProps {
  projectId: string
  onClose: () => void
  onSuccess?: (formId: string) => void
}

export function CreateFormModal({ projectId, onClose, onSuccess }: CreateFormModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  const createForm = useCreateForm()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      const form = await createForm.mutateAsync({
        projectId,
        name: name.trim(),
        description: description.trim() || undefined,
      })
      onSuccess?.(form.id)
      onClose()
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Create New Form</CardTitle>
          <CardDescription>
            Create a feedback form to collect responses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
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
                disabled={createForm.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of what this form is for..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={createForm.isPending}
                rows={3}
              />
            </div>

            <div className="flex space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createForm.isPending}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createForm.isPending || !name.trim()}
                className="flex-1"
              >
                {createForm.isPending ? 'Creating...' : 'Create Form'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}