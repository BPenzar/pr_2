'use client'

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { useCreateQuestion, useUpdateQuestion, useDeleteQuestion } from '@/hooks/use-questions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Question } from '@/types/database'
import { PlusIcon, MinusIcon, GripVerticalIcon, TrashIcon } from 'lucide-react'
import {
  ChoiceOption,
  normalizeChoiceOptions,
  sanitizeChoiceOptions,
} from '@/lib/question-utils'
import {
  OPTION_COLOR_CHOICES,
  OptionColorKey,
  getOptionColorConfig,
} from '@/lib/option-colors'

interface QuestionEditorProps {
  formId: string
  question?: Question
  orderIndex: number
  onSave?: () => void
  onCancel?: () => void
  onDelete?: () => void
  onDirtyChange?: (dirty: boolean) => void
}

const questionTypes = [
  { value: 'text', label: 'Short Text', description: 'Single line text input' },
  { value: 'textarea', label: 'Long Text', description: 'Multi-line text area' },
  { value: 'rating', label: 'Rating Scale', description: '1-5 or 1-10 rating' },
  { value: 'choice', label: 'Single Choice', description: 'Radio buttons' },
  { value: 'multiselect', label: 'Multiple Choice', description: 'Checkboxes' },
] as const

type EditableOption = {
  id: string
  label: string
  color: OptionColorKey | 'none'
}

const createEditableOption = (option?: ChoiceOption): EditableOption => {
  return {
    id: Math.random().toString(36).slice(2),
    label: option?.label ?? '',
    color: option?.color ?? 'none',
  }
}

export type QuestionEditorHandle = {
  submit: () => Promise<boolean>
}

type QuestionSnapshot = {
  type: Question['type']
  title: string
  description: string
  required: boolean
  options: Array<{ label: string; color: OptionColorKey | 'none' }>
  ratingScale: number | null
}

const buildSnapshotKey = (snapshot: QuestionSnapshot) => JSON.stringify(snapshot)

const buildSnapshotFromQuestion = (question?: Question): QuestionSnapshot => {
  const normalizedOptions = normalizeChoiceOptions(question?.options)
  const options: QuestionSnapshot['options'] =
    question && (question.type === 'choice' || question.type === 'multiselect')
      ? normalizedOptions.map((option) => ({
          label: option.label ?? '',
          color: (option.color ?? 'none') as OptionColorKey | 'none',
        }))
      : []

  return {
    type: question?.type ?? 'text',
    title: question?.title ?? '',
    description: question?.description ?? '',
    required: question?.required ?? false,
    options,
    ratingScale: question?.type === 'rating' ? question.rating_scale ?? 5 : null,
  }
}

export const QuestionEditor = forwardRef<QuestionEditorHandle, QuestionEditorProps>(function QuestionEditor(
  {
    formId,
    question,
    orderIndex,
    onSave,
    onCancel,
    onDelete,
    onDirtyChange,
  },
  ref
) {
  const [type, setType] = useState<Question['type']>(question?.type || 'text')
  const [title, setTitle] = useState(question?.title || '')
  const [description, setDescription] = useState(question?.description || '')
  const [required, setRequired] = useState(question?.required || false)
  const [options, setOptions] = useState<EditableOption[]>(() => {
    const normalized = normalizeChoiceOptions(question?.options)
    if (!normalized.length) {
      return [createEditableOption()]
    }
    return normalized.map((option) => createEditableOption(option))
  })
  const [ratingScale, setRatingScale] = useState<number>(question?.rating_scale || 5)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const initialSnapshotRef = useRef<string>(buildSnapshotKey(buildSnapshotFromQuestion(question)))
  const lastQuestionIdRef = useRef<string | undefined>(question?.id)

  const createQuestion = useCreateQuestion()
  const updateQuestion = useUpdateQuestion()
  const deleteQuestion = useDeleteQuestion()

  useEffect(() => {
    const nextQuestionId = question?.id
    if (lastQuestionIdRef.current === nextQuestionId) {
      return
    }
    lastQuestionIdRef.current = nextQuestionId

    if (question) {
      setType(question.type)
      setTitle(question.title ?? '')
      setDescription(question.description ?? '')
      setRequired(question.required ?? false)
      setRatingScale(question.rating_scale || 5)
      const normalized = normalizeChoiceOptions(question.options)
      setOptions(normalized.length ? normalized.map((option) => createEditableOption(option)) : [createEditableOption()])
      initialSnapshotRef.current = buildSnapshotKey(buildSnapshotFromQuestion(question))
      onDirtyChange?.(false)
      return
    }

    initialSnapshotRef.current = buildSnapshotKey({
      type: 'text',
      title: '',
      description: '',
      required: false,
      options: [],
      ratingScale: null,
    })
    onDirtyChange?.(false)
  }, [question, onDirtyChange])

  const isEditing = !!question
  const isChoiceType = type === 'choice' || type === 'multiselect'
  const isRatingType = type === 'rating'
  const typeLabel = questionTypes.find((questionType) => questionType.value === type)?.label ?? type
  const currentSnapshotKey = useMemo(
    () =>
      buildSnapshotKey({
        type,
        title,
        description,
        required,
        options: isChoiceType
          ? options.map((option) => ({
              label: option.label,
              color: option.color,
            }))
          : [],
        ratingScale: isRatingType ? ratingScale : null,
      }),
    [description, isChoiceType, isRatingType, options, ratingScale, required, title, type]
  )

  const isDirty = currentSnapshotKey !== initialSnapshotRef.current

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  const saveQuestion = async () => {
    setError(null)
    if (!title.trim()) {
      setError('Question text is required.')
      return false
    }

    try {
      const sanitizedOptionsRaw = isChoiceType
        ? sanitizeChoiceOptions(
            options.map((option) => ({
              label: option.label,
              color: option.color === 'none' ? undefined : option.color,
            }))
          )
        : undefined
      const sanitizedOptions = sanitizedOptionsRaw && sanitizedOptionsRaw.length ? sanitizedOptionsRaw : undefined

      const questionData = {
        formId,
        title: title.trim(),
        description: description.trim() || undefined,
        required,
        options: sanitizedOptions,
        rating_scale: isRatingType ? ratingScale : undefined,
      }

      if (isEditing) {
        await updateQuestion.mutateAsync({
          id: question.id,
          ...questionData,
        })
      } else {
        await createQuestion.mutateAsync({
          ...questionData,
          type,
          orderIndex,
        })
      }

      return true
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const wasSaved = await saveQuestion()
    if (wasSaved) {
      onSave?.()
    }
  }

  const handleHeaderClick = () => {
    if (!onCancel || isPending) return
    onCancel()
  }

  useImperativeHandle(ref, () => ({
    submit: async () => {
      const wasSaved = await saveQuestion()
      if (wasSaved) {
        onSave?.()
      }
      return wasSaved
    },
  }))

  const handleDelete = async () => {
    if (!question) return
    try {
      await deleteQuestion.mutateAsync({
        id: question.id,
        formId,
      })
      onDelete?.()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setConfirmDelete(false)
    }
  }

  const addOption = () => {
    setOptions((prev) => [...prev, createEditableOption()])
  }

  const removeOption = (index: number) => {
    setOptions((prev) => {
      if (prev.length <= 1) {
        return [createEditableOption()]
      }
      return prev.filter((_, i) => i !== index)
    })
  }

  const updateOptionLabel = (index: number, value: string) => {
    setOptions((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], label: value }
      return updated
    })
  }

  const updateOptionColor = (index: number, value: OptionColorKey | 'none') => {
    setOptions((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], color: value }
      return updated
    })
  }

  const isPending = createQuestion.isPending || updateQuestion.isPending || deleteQuestion.isPending

  return (
    <Card className="mb-4 border-slate-200/70 shadow-sm">
      <CardHeader
        className={`flex flex-row items-center justify-between space-y-0 border-b border-slate-200/70 bg-slate-50/70 pb-4 ${
          onCancel ? 'cursor-pointer' : ''
        }`}
        onClick={handleHeaderClick}
      >
        <div className="flex items-center space-x-2">
          <GripVerticalIcon className="w-4 h-4 text-gray-400" />
          <CardTitle className="text-base">
            {isEditing ? `Question ${orderIndex + 1}` : 'New Question'}
          </CardTitle>
          {isEditing && <span className="text-xs text-slate-400">{typeLabel}</span>}
        </div>
        {isEditing && (
          <div className="flex items-center space-x-2" onClick={(event) => event.stopPropagation()}>
            {confirmDelete ? (
              <>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isPending}
                >
                  Confirm delete
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDelete(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(true)}
                disabled={isPending}
                className="text-red-600 hover:text-red-700"
              >
                <TrashIcon className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isEditing && confirmDelete && (
            <div className="text-sm text-red-600">
              This question will be removed from the form immediately.
            </div>
          )}

          {!isEditing && (
            <div className="space-y-2">
              <Label>Question Type</Label>
              <Select
                value={type}
                onValueChange={(value) => setType(value as Question['type'])}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select question type" />
                </SelectTrigger>
                <SelectContent>
                  {questionTypes.map((questionType) => (
                    <SelectItem key={questionType.value} value={questionType.value}>
                      <div>
                        <div className="font-medium">{questionType.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {questionType.description}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Question Text</Label>
            <Input
              id="title"
              placeholder="Enter your question..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Additional instructions or context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPending}
              rows={2}
            />
          </div>

          {isChoiceType && (
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/70 p-4">
              <Label>Options</Label>
              <div className="space-y-3">
                {options.map((option, index) => {
                  return (
                    <div
                      key={option.id}
                      className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:gap-2"
                    >
                      <Input
                        placeholder={`Option ${index + 1}`}
                        value={option.label}
                        onChange={(e) => updateOptionLabel(index, e.target.value)}
                        disabled={isPending}
                        className="flex-1"
                      />
                      <div className="flex items-center gap-2">
                        <Select
                          value={option.color}
                          onValueChange={(value) => updateOptionColor(index, value as OptionColorKey | 'none')}
                          disabled={isPending}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Optional color" />
                          </SelectTrigger>
                          <SelectContent>
                            {OPTION_COLOR_CHOICES.map(({ value, label }) => {
                              if (value === 'none') {
                                return (
                                  <SelectItem key={value} value={value}>
                                    <div className="flex items-center gap-2 text-sm">{label}</div>
                                  </SelectItem>
                                )
                              }
                              const config = getOptionColorConfig(value)
                              return (
                                <SelectItem key={value} value={value}>
                                  <div className="flex items-center gap-2">
                                    <span className={`h-3 w-3 rounded-full ${config.chip}`} />
                                    <span className="text-sm">{label}</span>
                                  </div>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                        {options.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOption(index)}
                            disabled={isPending}
                          >
                            <MinusIcon className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  disabled={isPending}
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Option
                </Button>
              </div>
            </div>
          )}

          {isRatingType && (
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/70 p-4">
              <Label>Rating Scale</Label>
              <Select
                value={ratingScale.toString()}
                onValueChange={(value) => setRatingScale(parseInt(value))}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select rating scale" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">1-5 Stars</SelectItem>
                  <SelectItem value="10">1-10 Scale</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose between a 5-star rating or 1-10 numerical scale
              </p>
            </div>
          )}

          <div className="flex items-center space-x-2 rounded-lg border border-slate-200 bg-slate-50/70 p-3">
            <Checkbox
              id="required"
              checked={required}
              onCheckedChange={(checked) => setRequired(checked as boolean)}
              disabled={isPending}
            />
            <Label htmlFor="required">Required question</Label>
          </div>

          <div className="flex space-x-2 pt-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isPending}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isPending || !title.trim()}
            >
              {isPending ? 'Saving...' : isEditing ? 'Update Question' : 'Add Question'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
})

QuestionEditor.displayName = 'QuestionEditor'
