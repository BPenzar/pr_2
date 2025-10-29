'use client'

import { useState } from 'react'
import { useForm, useUpdateForm } from '@/hooks/use-forms'
import { useQRCodes } from '@/hooks/use-qr-codes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { QuestionEditor } from './question-editor'
import { PlusIcon, SaveIcon, EyeIcon, SettingsIcon, QrCodeIcon, BarChart3Icon } from 'lucide-react'
import Link from 'next/link'

interface FormBuilderProps {
  formId: string
}

export function FormBuilder({ formId }: FormBuilderProps) {
  const [isAddingQuestion, setIsAddingQuestion] = useState(false)
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const { data: form, isLoading, error } = useForm(formId)
  const { data: qrCodes } = useQRCodes(formId)
  const updateForm = useUpdateForm()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
        <div className="h-64 bg-gray-200 animate-pulse rounded"></div>
      </div>
    )
  }

  if (error || !form) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading form: {error?.message || 'Form not found'}</p>
      </div>
    )
  }

  const questions = form.questions?.sort((a: any, b: any) => a.order_index - b.order_index) || []

  const handleAddQuestion = () => {
    setIsAddingQuestion(true)
    setEditingQuestionId(null)
  }

  const handleEditQuestion = (questionId: string) => {
    setEditingQuestionId(questionId)
    setIsAddingQuestion(false)
  }

  const handleQuestionSaved = () => {
    setIsAddingQuestion(false)
    setEditingQuestionId(null)
  }

  const handleCancelEdit = () => {
    setIsAddingQuestion(false)
    setEditingQuestionId(null)
  }

  return (
    <div className="space-y-6">
      {/* Form Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-xl">{form.name}</CardTitle>
              <CardDescription className="mt-1">
                {form.description || 'No description'}
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Link href={`/forms/${formId}/settings`}>
                <Button variant="outline" size="sm">
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </Link>
              <Link href={`/forms/${formId}/analytics`}>
                <Button variant="outline" size="sm">
                  <BarChart3Icon className="w-4 h-4 mr-2" />
                  Analytics
                </Button>
              </Link>
              <Link href={`/forms/${formId}/qr`}>
                <Button variant="outline" size="sm">
                  <QrCodeIcon className="w-4 h-4 mr-2" />
                  QR Codes
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Create a preview URL with form data
                  const previewUrl = `/forms/${formId}/preview`
                  window.open(previewUrl, '_blank')
                }}
              >
                <EyeIcon className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button
                size="sm"
                onClick={async () => {
                  if (!form) return

                  try {
                    await updateForm.mutateAsync({
                      id: formId,
                      name: form.name,
                      description: form.description ?? undefined,
                      is_active: !form.is_active
                    })
                  } catch (error) {
                    console.error('Failed to update form status:', error)
                  }
                }}
                disabled={updateForm.isPending}
              >
                <SaveIcon className="w-4 h-4 mr-2" />
                {form?.is_active ? 'Unpublish' : 'Publish'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>{questions.length} questions</span>
              <span>•</span>
              <span>0 responses</span>
              <span>•</span>
              <span className={form.is_active ? 'text-green-600' : 'text-red-600'}>
                {form.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            {form.is_active && qrCodes && qrCodes.length > 0 && (
              <Link href={`/f/${qrCodes[0].short_url}`} target="_blank">
                <Button variant="outline" size="sm">
                  View Live Form
                </Button>
              </Link>
            )}
            {form.is_active && (!qrCodes || qrCodes.length === 0) && (
              <Button variant="outline" size="sm" disabled>
                No QR Code Yet
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((question: any, index: number) => (
          <div key={question.id}>
            {editingQuestionId === question.id ? (
              <QuestionEditor
                formId={formId}
                question={question}
                orderIndex={index}
                onSave={handleQuestionSaved}
                onCancel={handleCancelEdit}
                onDelete={handleQuestionSaved}
              />
            ) : (
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1" onClick={() => handleEditQuestion(question.id)}>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium text-gray-500">
                          Question {index + 1}
                        </span>
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                          {question.type}
                        </span>
                        {question.required && (
                          <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                            Required
                          </span>
                        )}
                      </div>
                      <h3 className="font-medium">{question.title}</h3>
                      {question.description && (
                        <p className="text-sm text-gray-600 mt-1">{question.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditQuestion(question.id)}
                    >
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ))}

        {/* Add Question */}
        {isAddingQuestion ? (
          <QuestionEditor
            formId={formId}
            orderIndex={questions.length}
            onSave={handleQuestionSaved}
            onCancel={handleCancelEdit}
          />
        ) : (
          <Card className="border-dashed border-2 border-gray-300 hover:border-gray-400 transition-colors">
            <CardContent className="p-8">
              <div className="text-center">
                <Button onClick={handleAddQuestion} variant="ghost" className="w-full">
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Add Question
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Empty State */}
      {questions.length === 0 && !isAddingQuestion && (
        <Card className="border-dashed border-2">
          <CardContent className="p-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <PlusIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No questions yet</h3>
              <p className="text-gray-600 mb-6">
                Add your first question to start building your form
              </p>
              <Button onClick={handleAddQuestion}>
                <PlusIcon className="w-4 h-4 mr-2" />
                Add First Question
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
