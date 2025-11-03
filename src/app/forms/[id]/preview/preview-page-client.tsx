'use client'

import { useState } from 'react'
import { useForm } from '@/hooks/use-forms'
import { useQuestions } from '@/hooks/use-questions'
import { FormPreview } from '@/components/public-form/form-preview'
import { Button } from '@/components/ui/button'
import { ArrowLeftIcon, MonitorIcon, SmartphoneIcon } from 'lucide-react'
import Link from 'next/link'

interface FormPreviewPageClientProps {
  formId: string
}

export function FormPreviewPageClient({ formId }: FormPreviewPageClientProps) {
  const [viewport] = useState<'desktop' | 'mobile'>('desktop')
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
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 py-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Form Preview</h1>
              <p className="text-gray-600">This is how your form will appear to users</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/forms/${formId}`}>
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Back to Editor
                </Link>
              </Button>
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                Preview Mode
              </div>
              {/*
              <Button
                variant={viewport === 'desktop' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewport('desktop')}
              >
                <MonitorIcon className="w-4 h-4 mr-2" />
                Desktop
              </Button>
              <Button
                variant={viewport === 'mobile' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewport('mobile')}
              >
                <SmartphoneIcon className="w-4 h-4 mr-2" />
                Mobile
              </Button>
              */}
            </div>
          </div>
        </div>
      </div>

      <FormPreview form={formData} stacked={viewport === 'mobile'} />
    </div>
  )
}
