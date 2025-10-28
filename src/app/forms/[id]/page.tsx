'use client'

import { useParams } from 'next/navigation'
import { useForm } from '@/hooks/use-forms'
import { FormBuilder } from '@/components/forms/form-builder'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeftIcon } from 'lucide-react'

export default function FormBuilderPage() {
  const params = useParams()
  const formId = params.id as string
  const { data: form, isLoading } = useForm(formId)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading form...</div>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Form not found</h2>
          <p className="text-gray-600 mb-4">
            The form you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link href={`/projects/${form.project.id}`}>
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to {form.project.name}
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Form Builder</h1>
              <p className="text-gray-600">Build and customize your feedback form</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <FormBuilder formId={formId} />
      </div>
    </div>
  )
}