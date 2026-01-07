'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useUpdateForm } from '@/hooks/use-forms'
import { useQRCodes } from '@/hooks/use-qr-codes'
import { useReorderQuestions } from '@/hooks/use-questions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { QuestionEditor, QuestionEditorHandle } from './question-editor'
import { PlusIcon, ArrowUpIcon, ArrowDownIcon, FileTextIcon } from 'lucide-react'
import Link from 'next/link'
import { useExportFormStructure } from '@/hooks/use-csv-export'

interface FormBuilderProps {
  formId: string
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
  text: 'Short Text',
  textarea: 'Long Text',
  rating: 'Rating Scale',
  choice: 'Single Choice',
  multiselect: 'Multiple Choice',
}

export function FormBuilder({ formId }: FormBuilderProps) {
  const [isAddingQuestion, setIsAddingQuestion] = useState(false)
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const { data: form, isLoading, error } = useForm(formId)
  const { data: qrCodes } = useQRCodes(formId)
  const updateForm = useUpdateForm()
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [submissionLayout, setSubmissionLayout] = useState<'single' | 'step'>('single')
  const [questionsPerStep, setQuestionsPerStep] = useState(1)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [hasMetaChanges, setHasMetaChanges] = useState(false)
  const [hasQuestionChanges, setHasQuestionChanges] = useState(false)
  const [isSavingAll, setIsSavingAll] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const questionEditorRef = useRef<QuestionEditorHandle | null>(null)
  const saveSuccessTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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
      if (!questions.length) return []
      if (!prev.length) return questions

      const questionMap = new Map(questions.map((question: any) => [question.id, question]))
      const merged = prev
        .map((question) => questionMap.get(question.id) ?? question)
        .filter((question) => questionMap.has(question.id))
      const additions = questions.filter(
        (question: any) => !prev.some((prevQuestion) => prevQuestion.id === question.id)
      )

      return [...merged, ...additions]
    })
  }, [questions])

  useEffect(() => {
    if (!form) return
    setFormName(form.name ?? '')
    setFormDescription(form.description ?? '')
    setSubmissionLayout(form.submission_layout ?? 'single')
    setQuestionsPerStep(
      typeof form.questions_per_step === 'number' && Number.isFinite(form.questions_per_step)
        ? Math.max(1, Math.floor(form.questions_per_step))
        : 1
    )
    setHasMetaChanges(false)
  }, [form])

  useEffect(() => {
    return () => {
      if (saveSuccessTimeoutRef.current) {
        clearTimeout(saveSuccessTimeoutRef.current)
      }
    }
  }, [])

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
    void (async () => {
      const metaSaved = await autoSaveMetaChanges()
      if (!metaSaved) return
      const questionSaved = await autoSaveQuestionEdits()
      if (!questionSaved) return
      setIsAddingQuestion(true)
      setEditingQuestionId(null)
      setHasQuestionChanges(false)
    })()
  }

  const handleEditQuestion = (questionId: string) => {
    if (editingQuestionId === questionId && !isAddingQuestion) return
    void (async () => {
      const metaSaved = await autoSaveMetaChanges()
      if (!metaSaved) return
      const questionSaved = await autoSaveQuestionEdits()
      if (!questionSaved) return
      setEditingQuestionId(questionId)
      setIsAddingQuestion(false)
      setHasQuestionChanges(false)
    })()
  }

  const handleQuestionSaved = () => {
    setIsAddingQuestion(false)
    setEditingQuestionId(null)
    setHasQuestionChanges(false)
  }

  const handleCancelEdit = () => {
    setIsAddingQuestion(false)
    setEditingQuestionId(null)
    setHasQuestionChanges(false)
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
    clearSaveSuccess()
  }

  const handleLayoutChange = (layout: 'single' | 'step') => {
    setSubmissionLayout(layout)
    setSaveError(null)
    setHasMetaChanges(true)
    clearSaveSuccess()
  }

  const handleQuestionsPerStepChange = (value: string) => {
    const parsed = Number(value)
    const sanitized = Number.isFinite(parsed) ? Math.max(1, Math.floor(parsed)) : 1
    setQuestionsPerStep(sanitized)
    setSaveError(null)
    setHasMetaChanges(true)
    clearSaveSuccess()
  }

  const handleMetaSave = async () => {
    if (!hasMetaChanges && !hasQuestionChanges) return
    setIsSavingAll(true)
    setSaveError(null)
    clearSaveSuccess()
    let saveCompleted = false
    try {
      const questionSaved = await autoSaveQuestionEdits()
      if (!questionSaved) return
      const metaSaved = await autoSaveMetaChanges()
      if (!metaSaved) return
      saveCompleted = true
    } catch (err: any) {
      console.error('Failed to update form details:', err)
      setSaveError(err?.message || 'Failed to save form settings.')
    } finally {
      setIsSavingAll(false)
    }
    if (saveCompleted) {
      triggerSaveSuccess()
    }
  }

  const buildMetaPayload = () => ({
    id: formId,
    name: formName.trim(),
    description: formDescription.trim() === '' ? null : formDescription.trim(),
    submission_layout: submissionLayout,
    questions_per_step: submissionLayout === 'step' ? questionsPerStep : 1,
  })

  const autoSaveMetaChanges = async () => {
    if (!hasMetaChanges) return true
    setSaveError(null)
    try {
      await updateForm.mutateAsync(buildMetaPayload())
      setHasMetaChanges(false)
      return true
    } catch (err: any) {
      console.error('Failed to auto-save form settings:', err)
      setSaveError(err?.message || 'Failed to save form settings.')
      return false
    }
  }

  const autoSaveQuestionEdits = async () => {
    if (!hasQuestionChanges || !questionEditorRef.current) return true
    const saved = await questionEditorRef.current.submit()
    if (saved) {
      setHasQuestionChanges(false)
    }
    return saved
  }

  const clearSaveSuccess = () => {
    if (saveSuccessTimeoutRef.current) {
      clearTimeout(saveSuccessTimeoutRef.current)
      saveSuccessTimeoutRef.current = null
    }
    setSaveSuccess(false)
  }

  const triggerSaveSuccess = () => {
    clearSaveSuccess()
    setSaveSuccess(true)
    saveSuccessTimeoutRef.current = setTimeout(() => {
      setSaveSuccess(false)
    }, 2000)
  }

  const handleMetaFocus = () => {
    void autoSaveQuestionEdits()
  }

  const handleQuestionDirtyChange = (dirty: boolean) => {
    setHasQuestionChanges(dirty)
    if (dirty) {
      clearSaveSuccess()
    }
  }

  return (
    <div className="space-y-8">
      {/* Form details */}
      <Card className="border-slate-200/70 shadow-sm">
        <CardHeader className="flex flex-col gap-4 border-b border-slate-200/70 bg-slate-50/70 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Form Details</CardTitle>
            <CardDescription>
              Update the name and description shown to respondents. Saving applies any open question edits too.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleMetaSave}
              disabled={(!hasMetaChanges && !hasQuestionChanges) || updateForm.isPending || isSavingAll}
              size="sm"
            >
              {updateForm.isPending || isSavingAll ? 'Saving...' : saveSuccess ? 'Saved ✓' : 'Save All Changes'}
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
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="builder-form-name">Form Name</Label>
            <Input
              id="builder-form-name"
              value={formName}
              onChange={(event) => handleMetaChange('name', event.target.value)}
              onFocus={handleMetaFocus}
              placeholder="Enter form name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="builder-form-description">Description</Label>
            <Textarea
              id="builder-form-description"
              value={formDescription}
              onChange={(event) => handleMetaChange('description', event.target.value)}
              onFocus={handleMetaFocus}
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

      <Card className="border-slate-200/70 shadow-sm">
        <CardHeader className="flex flex-col gap-4 border-b border-slate-200/70 bg-slate-50/70 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Form Experience</CardTitle>
            <CardDescription>
              Choose how respondents move through your questions.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {saveError && (
            <Alert variant="destructive">
              <AlertDescription>{saveError}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="builder-form-layout">Question flow</Label>
            <select
              id="builder-form-layout"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={submissionLayout}
              onChange={(event) => handleLayoutChange(event.target.value as 'single' | 'step')}
              onFocus={handleMetaFocus}
            >
              <option value="single">All questions on one page (scroll)</option>
              <option value="step">Step-by-step sections</option>
            </select>
          </div>

          {submissionLayout === 'step' && (
            <div className="space-y-2">
              <Label htmlFor="builder-questions-per-step">Questions per section</Label>
              <Input
                id="builder-questions-per-step"
                type="number"
                min={1}
                max={50}
                value={questionsPerStep}
                onChange={(event) => handleQuestionsPerStepChange(event.target.value)}
                onFocus={handleMetaFocus}
              />
              <p className="text-xs text-muted-foreground">
                Respondents will see this many questions before tapping Next.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Questions List */}
      <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200/70 bg-slate-50/70 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Questions</h2>
            <p className="text-sm text-slate-500">
              Click a question to edit and use the arrows to reorder.
            </p>
          </div>
          <Button onClick={handleAddQuestion} size="sm" className="self-start sm:self-auto">
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Question
          </Button>
        </div>
        <div className="space-y-4 p-6">
        {orderedQuestions.map((question: any, index: number) => {
          const canMoveUp = index > 0
          const canMoveDown = index < orderedQuestions.length - 1
          const typeLabel = QUESTION_TYPE_LABELS[question.type] ?? question.type

          return (
            <div key={question.id}>
              {editingQuestionId === question.id ? (
                <QuestionEditor
                  ref={questionEditorRef}
                  formId={formId}
                  question={question}
                  orderIndex={index}
                  onSave={handleQuestionSaved}
                  onCancel={handleCancelEdit}
                  onDelete={handleQuestionSaved}
                  onDirtyChange={handleQuestionDirtyChange}
                />
              ) : (
                <Card className="cursor-pointer border-slate-200/70 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1" onClick={() => handleEditQuestion(question.id)}>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Question {index + 1}
                          </span>
                          <span className="text-xs text-slate-400">• {typeLabel}</span>
                          {question.required && (
                            <span className="text-xs px-2 py-1 bg-rose-100 text-rose-700 rounded-full">
                              Required
                            </span>
                          )}
                        </div>
                        <h3 className="font-medium text-slate-900">{question.title}</h3>
                        {question.description && (
                          <p className="text-sm text-slate-600 mt-1">{question.description}</p>
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
                          className="h-8 w-8 text-slate-500 hover:text-slate-900 disabled:opacity-40"
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
                          className="h-8 w-8 text-slate-500 hover:text-slate-900 disabled:opacity-40"
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
            ref={questionEditorRef}
            formId={formId}
            orderIndex={nextOrderIndex}
            onSave={handleQuestionSaved}
            onCancel={handleCancelEdit}
            onDirtyChange={handleQuestionDirtyChange}
          />
        ) : (
          <Card className="border-dashed border-2 border-slate-200 bg-slate-50/70 hover:border-slate-300 transition-colors">
            <CardContent className="p-6">
              <div className="text-center">
                <Button onClick={handleAddQuestion} variant="ghost" className="w-full">
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Add another question
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        </div>
      </div>

      {/* Empty State */}
      {orderedQuestions.length === 0 && !isAddingQuestion && (
        <Card className="border-dashed border-2 border-slate-200 bg-slate-50/70">
          <CardContent className="p-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                <PlusIcon className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No questions yet</h3>
              <p className="text-slate-600 mb-6">
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
