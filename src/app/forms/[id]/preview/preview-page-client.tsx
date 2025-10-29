'use client'

import { useForm } from '@/hooks/use-forms'
import { useQuestions } from '@/hooks/use-questions'
import { FormPreview } from '@/components/public-form/form-preview'
import { Button } from '@/components/ui/button'
import { ArrowLeftIcon } from 'lucide-react'
import Link from 'next/link'

interface FormPreviewPageClientProps {
  formId: string
}

export function FormPreviewPageClient({ formId }: FormPreviewPageClientProps) {
  const { data: form, isLoading: formLoading } = useForm(formId)
  const { data: questions, isLoading: questionsLoading } = useQuestions(formId)

  if (formLoading || questionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading preview...</p>
        </div>
      </div>
    )
  }

  if (!form || !questions) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Form not found</p>
          <Link href="/dashboard">
            <Button className="mt-4">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  const formData = {
    id: form.id,
    name: form.name,
    description: form.description,
    questions,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href={`/forms/${formId}`}>
              <Button variant="outline" size="sm">
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Editor
              </Button>
            </Link>
            <div>
              <h1 className="font-semibold text-gray-900">Form Preview</h1>
              <p className="text-sm text-gray-600">This is how your form will appear to users</p>
            </div>
          </div>
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            Preview Mode
          </div>
        </div>
      </div>

      <div className="py-8">
        <FormPreview form={formData} />
      </div>
    </div>
  )
}
