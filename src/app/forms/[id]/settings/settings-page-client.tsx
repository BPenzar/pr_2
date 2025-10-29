'use client'

import { useEffect, useState } from 'react'
import { useForm, useUpdateForm } from '@/hooks/use-forms'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ArrowLeftIcon, SaveIcon, TrashIcon } from 'lucide-react'
import Link from 'next/link'

interface FormSettingsPageClientProps {
  formId: string
}

export function FormSettingsPageClient({ formId }: FormSettingsPageClientProps) {
  const { data: form, isLoading } = useForm(formId)
  const updateForm = useUpdateForm()

  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (form) {
      setFormName(form.name)
      setFormDescription(form.description || '')
      setIsActive(form.is_active)
    }
  }, [form])

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <p className="text-gray-600">Form not found</p>
          <Link href="/dashboard">
            <Button className="mt-4">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleSave = async () => {
    try {
      await updateForm.mutateAsync({
        id: formId,
        name: formName,
        description: formDescription,
        is_active: isActive,
      })
      setHasChanges(false)
    } catch (error) {
      console.error('Failed to update form:', error)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setHasChanges(true)
    if (field === 'name') setFormName(value as string)
    if (field === 'description') setFormDescription(value as string)
    if (field === 'is_active') setIsActive(value as boolean)
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href={`/forms/${formId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Form
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Form Settings</h1>
            <p className="text-gray-600">Manage your form configuration</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={!hasChanges || updateForm.isPending}>
          <SaveIcon className="w-4 h-4 mr-2" />
          {updateForm.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Basic information about your form</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="form-name">Form Name</Label>
              <Input
                id="form-name"
                value={formName}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter form name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="form-description">Description</Label>
              <Textarea
                id="form-description"
                value={formDescription}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter form description (optional)"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Form Status</CardTitle>
            <CardDescription>Control whether your form accepts new responses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Form Active</Label>
                <p className="text-sm text-gray-600">
                  {isActive
                    ? 'Form is currently accepting responses'
                    : 'Form is inactive and not accepting responses'}
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={(checked) => handleInputChange('is_active', checked)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Form Information</CardTitle>
            <CardDescription>Read-only information about this form</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Form ID:</span>
              <span className="text-sm font-mono">{form.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Created:</span>
              <span className="text-sm">{new Date(form.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Last Updated:</span>
              <span className="text-sm">{new Date(form.updated_at).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Status:</span>
              <span className={`text-sm font-medium ${form.is_active ? 'text-green-600' : 'text-red-600'}`}>
                {form.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions that will affect your form permanently</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
              <div>
                <h4 className="font-medium text-red-600">Delete Form</h4>
                <p className="text-sm text-gray-600">
                  This will permanently delete the form, all questions, QR codes, and responses.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
                    alert('Delete functionality not implemented yet')
                  }
                }}
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Delete Form
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
