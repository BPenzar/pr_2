'use client'

import { useEffect, useState } from 'react'
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

export function QuestionEditor({
  formId,
  question,
  orderIndex,
  onSave,
  onCancel,
  onDelete,
}: QuestionEditorProps) {
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

  const createQuestion = useCreateQuestion()
  const updateQuestion = useUpdateQuestion()
  const deleteQuestion = useDeleteQuestion()

  useEffect(() => {
    if (question) {
      const normalized = normalizeChoiceOptions(question.options)
      setOptions(normalized.length ? normalized.map((option) => createEditableOption(option)) : [createEditableOption()])
    } else {
      setOptions((prev) => (prev.length ? prev : [createEditableOption()]))
    }
  }, [question])

  const isEditing = !!question
  const isChoiceType = type === 'choice' || type === 'multiselect'
  const isRatingType = type === 'rating'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

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

      onSave?.()
    } catch (err: any) {
      setError(err.message)
    }
  }

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
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center space-x-2">
          <GripVerticalIcon className="w-4 h-4 text-gray-400" />
          <CardTitle className="text-base">
            {isEditing ? `Question ${orderIndex + 1}` : 'New Question'}
          </CardTitle>
        </div>
        {isEditing && (
          <div className="flex items-center space-x-2">
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
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              <Select value={type} onValueChange={(value) => setType(value as Question['type'])}>
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
            <div className="space-y-2">
              <Label>Options</Label>
              <div className="space-y-2">
                {options.map((option, index) => {
                  return (
                    <div
                      key={option.id}
                      className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:gap-2"
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
            <div className="space-y-2">
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

          <div className="flex items-center space-x-2">
            <Checkbox
              id="required"
              checked={required}
              onCheckedChange={(checked) => setRequired(checked as boolean)}
              disabled={isPending}
            />
            <Label htmlFor="required">Required question</Label>
          </div>

          <div className="flex space-x-2 pt-4">
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
}
