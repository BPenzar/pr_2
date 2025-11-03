'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm, useUpdateForm } from '@/hooks/use-forms'
import { useQRCodes } from '@/hooks/use-qr-codes'
import { useReorderQuestions } from '@/hooks/use-questions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { QuestionEditor } from './question-editor'
import { PlusIcon, ArrowUpIcon, ArrowDownIcon, FileTextIcon } from 'lucide-react'
import Link from 'next/link'
import { useExportFormStructure } from '@/hooks/use-csv-export'

interface FormBuilderProps {
  formId: string
}

export function FormBuilder({ formId }: FormBuilderProps) {
  const [isAddingQuestion, setIsAddingQuestion] = useState(false)
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const { data: form, isLoading, error } = useForm(formId)
  const { data: qrCodes } = useQRCodes(formId)
  const updateForm = useUpdateForm()
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [hasMetaChanges, setHasMetaChanges] = useState(false)
  const reorderQuestions = useReorderQuestions()
  const exportStructure = useExportFormStructure()

  const questions = useMemo(() => {
    if (!form?.questions) {
      return []
    }
    return [...form.questions].sort((a: any, b: any) => a.order_index - b.order_index)
  }, [form?.questions])
  const [orderedQuestions, setOrderedQuestions] = useState(questions)
  const nextOrderIndex = useMemo(() => {
    if (orderedQuestions.length === 0) return 0
    const maxIndex = orderedQuestions.reduce((max, question: any) => {
      const current = typeof question.order_index === 'number' ? question.order_index : -1
      return current > max ? current : max
    }, -1)
    return maxIndex + 1
  }, [orderedQuestions])

  useEffect(() => {
    setOrderedQuestions((prev) => {
      if (prev.length === questions.length && prev.every((q, idx) => q.id === questions[idx]?.id)) {
        return prev
      }
      return questions
    })
  }, [questions])

  useEffect(() => {
    if (!form) return
    setFormName(form.name ?? '')
    setFormDescription(form.description ?? '')
    setHasMetaChanges(false)
  }, [form])

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

  const handleMoveQuestion = (questionId: string, direction: 'up' | 'down') => {
    setOrderedQuestions((prev) => {
      const previousState = prev
      const index = prev.findIndex((q) => q.id === questionId)
      if (index === -1) return prev

      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= prev.length) return prev

      const updated = [...prev]
      ;[updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]]

      const updatedWithOrder = updated.map((question, idx) => ({
        ...question,
        order_index: idx,
      }))

      reorderQuestions.mutate(
        {
          formId,
          questions: updatedWithOrder.map((q, idx) => ({ id: q.id, orderIndex: idx })),
        },
        {
          onError: () => {
            setOrderedQuestions(previousState)
          },
        }
      )

      return updatedWithOrder
    })
  }

  const handleMetaChange = (kind: 'name' | 'description', value: string) => {
    if (kind === 'name') setFormName(value)
    if (kind === 'description') setFormDescription(value)
    setHasMetaChanges(true)
  }

  const handleMetaSave = async () => {
    try {
      await updateForm.mutateAsync({
        id: formId,
        name: formName.trim(),
        description: formDescription.trim() === '' ? null : formDescription.trim(),
      })
      setHasMetaChanges(false)
    } catch (err) {
      console.error('Failed to update form details:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Form details */}
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Form Details</CardTitle>
            <CardDescription>Update the name and description shown to respondents</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleMetaSave}
              disabled={!hasMetaChanges || updateForm.isPending}
              size="sm"
            >
              {updateForm.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!form) return
                exportStructure.mutate({
                  form: {
                    id: form.id,
                    name: formName || form.name,
                    description: formDescription || form.description,
                    questions: form.questions || [],
                  }
                })
              }}
              disabled={!form || exportStructure.isPending}
            >
              {exportStructure.isPending ? (
                'Exporting...'
              ) : (
                <>
                  <FileTextIcon className="h-4 w-4 mr-2" />
                  Export Form Structure
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="builder-form-name">Form Name</Label>
            <Input
              id="builder-form-name"
              value={formName}
              onChange={(event) => handleMetaChange('name', event.target.value)}
              placeholder="Enter form name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="builder-form-description">Description</Label>
            <Textarea
              id="builder-form-description"
              value={formDescription}
              onChange={(event) => handleMetaChange('description', event.target.value)}
              placeholder="Enter form description (optional)"
              rows={3}
            />
          </div>

          {/* <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>{orderedQuestions.length} questions</span>
            <span>•</span>
            <span>{form.is_active ? 'Active' : 'Inactive'}</span>
            {form.is_active && qrCodes && qrCodes.length > 0 && (
              <Link href={`/f/${qrCodes[0].short_url}`} target="_blank" className="text-primary hover:underline">
                View live form
              </Link>
            )}
          </div> */}

        </CardContent>
      </Card>

      {/* Questions List */}
      <div className="space-y-4">
        {orderedQuestions.map((question: any, index: number) => {
          const canMoveUp = index > 0
          const canMoveDown = index < orderedQuestions.length - 1

          return (
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
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(event) => {
                            event.stopPropagation()
                            handleMoveQuestion(question.id, 'up')
                          }}
                          disabled={!canMoveUp || reorderQuestions.isPending}
                          className="h-8 w-8 text-gray-500 hover:text-gray-900 disabled:opacity-40"
                          aria-label="Move question up"
                        >
                          <ArrowUpIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(event) => {
                            event.stopPropagation()
                            handleMoveQuestion(question.id, 'down')
                          }}
                          disabled={!canMoveDown || reorderQuestions.isPending}
                          className="h-8 w-8 text-gray-500 hover:text-gray-900 disabled:opacity-40"
                          aria-label="Move question down"
                        >
                          <ArrowDownIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation()
                            handleEditQuestion(question.id)
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )
        })}

        {/* Add Question */}
        {isAddingQuestion ? (
          <QuestionEditor
            formId={formId}
            orderIndex={nextOrderIndex}
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
      {orderedQuestions.length === 0 && !isAddingQuestion && (
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
