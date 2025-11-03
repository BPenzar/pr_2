'use client'

import { useState } from 'react'
import { useResponses, useDeleteResponse } from '@/hooks/use-responses'
import { useForm } from '@/hooks/use-forms'
import { useExportResponses } from '@/hooks/use-csv-export'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TrashIcon, DownloadIcon, FilterIcon, StarIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { Question } from '@/types/database'

const getRatingSelectedClasses = (value: number) => {
  if (value <= 6) return 'border-red-600 bg-red-600 text-white shadow-sm'
  if (value <= 8) return 'border-yellow-500 bg-yellow-500 text-white shadow-sm'
  if (value === 9) return 'border-green-500 bg-green-500 text-white shadow-sm'
  return 'border-green-700 bg-green-700 text-white shadow-sm'
}

const RATING_BASE_CLASSES =
  'border-gray-200 bg-gray-50 text-gray-600'

const emptyDisplay = (
  <span className="text-sm font-medium text-red-500">
    No answer provided
  </span>
)

interface ResponseViewerProps {
  formId: string
  formName: string
}

export function ResponseViewer({ formId, formName }: ResponseViewerProps) {
  const { data: responses, isLoading, error } = useResponses(formId)
  const { data: form } = useForm(formId)
  const deleteResponse = useDeleteResponse()
  const exportResponses = useExportResponses()
  const [selectedResponse, setSelectedResponse] = useState<string | null>(null)

  const handleDelete = async (responseId: string) => {
    if (!confirm('Are you sure you want to delete this response?')) return

    try {
      await deleteResponse.mutateAsync(responseId)
    } catch (error) {
      console.error('Failed to delete response:', error)
    }
  }

  const handleExportCSV = async () => {
    if (!responses || !form) {
      return
    }

    // Transform responses to exportable format
    const exportableResponses = responses.map(response => ({
      id: response.id,
      submitted_at: response.submitted_at,
      ip_hash: response.ip_hash,
      user_agent: (response as any).user_agent_hash,
      items: response.response_items.map(item => ({
        id: item.id,
        question_id: item.question_id,
        question_title: item.questions.title,
        question_type: item.questions.type,
        text_value: item.value,
        number_value: item.questions.type === 'rating' ? parseInt(item.value) : undefined,
        choice_values: item.questions.type === 'multiselect' ?
          JSON.parse(item.value) :
          item.questions.type === 'choice' ? [item.value] : undefined
      }))
    }))

    // Transform form to exportable format
    const exportableForm = {
      id: form.id,
      name: form.name,
      description: form.description,
      questions: form.questions?.map((q: Question) => ({
        id: q.id,
        title: q.title,
        description: q.description,
        type: q.type,
        required: q.required,
        order_index: q.order_index
      })) || []
    }

    await exportResponses.mutateAsync({
      responses: exportableResponses,
      form: exportableForm,
      includeMetadata: true
    })
  }

  const renderResponseValue = (item: any) => {
    const { value, questions } = item

    if (questions.type === 'rating') {
      const maxScale = typeof questions.rating_scale === 'number' && questions.rating_scale > 0
        ? questions.rating_scale
        : 10
      const rating = parseInt(value)

       if (!Number.isFinite(rating)) {
        return emptyDisplay
      }

      if (maxScale === 5) {
        return (
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <StarIcon
                key={i}
                className={`w-4 h-4 ${
                  i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                }`}
              />
            ))}
            <span className="ml-2 text-sm text-gray-600">({rating}/5)</span>
          </div>
        )
      }

      return (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-800">{rating}</span>
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: maxScale }, (_, index) => {
              const valueLabel = index + 1
              const isSelected = valueLabel === rating
              return (
                <span
                  key={valueLabel}
                  className={`flex h-8 min-w-[2.25rem] items-center justify-center rounded-xl border px-2 text-xs font-semibold ${
                    isSelected ? getRatingSelectedClasses(valueLabel) : RATING_BASE_CLASSES
                  }`}
                >
                  {valueLabel}
                </span>
              )
            })}
          </div>
          <span className="text-xs text-gray-500">out of {maxScale}</span>
        </div>
      )
    }

    if (questions.type === 'multiselect') {
      try {
        const selections = JSON.parse(value)
        if (!Array.isArray(selections) || selections.length === 0) {
          return emptyDisplay
        }
        return (
          <div className="flex flex-wrap gap-1">
            {selections.map((selection: string, index: number) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {selection}
              </Badge>
            ))}
          </div>
        )
      } catch {
        return <span className="text-gray-600">{value}</span>
      }
    }

    if (questions.type === 'choice') {
      if (!value) return emptyDisplay
      return (
        <Badge variant="outline" className="border border-gray-200 text-gray-700">
          {value}
        </Badge>
      )
    }

    if (questions.type === 'textarea') {
      if (!value) return emptyDisplay
      return (
        <div className="max-w-xs">
          <p className="text-sm text-gray-700 line-clamp-3">{value}</p>
        </div>
      )
    }

    if (!value) return emptyDisplay
    return <span className="text-gray-700">{value}</span>
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-4 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-4 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load responses: {error.message}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>Responses</CardTitle>
              <CardDescription>
                {responses?.length || 0} responses for {formName}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={!responses || responses.length === 0 || exportResponses.isPending}
                className="justify-center"
              >
                <DownloadIcon className="w-4 h-4 mr-2" />
                {exportResponses.isPending ? 'Exporting...' : 'Export Responses (CSV)'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Responses List */}
      {!responses || responses.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <FilterIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No responses yet</h3>
              <p className="text-gray-600">
                Responses will appear here once people start submitting your form
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {responses.map((response) => {
            const submittedAt = new Date(response.submitted_at)
            const relativeSubmitted = formatDistanceToNow(submittedAt)
            const formattedSubmitted = submittedAt.toLocaleString()

            return (
              <Card key={response.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                        <span>
                          {relativeSubmitted} ago
                        </span>
                        {response.qr_codes?.location_name && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <Badge variant="secondary" className="text-xs">
                              {response.qr_codes.location_name}
                            </Badge>
                          </>
                        )}
                        {response.qr_codes?.short_url && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <span className="font-mono text-xs break-all">
                              {response.qr_codes.short_url}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Submitted {formattedSubmitted}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(response.id)}
                      disabled={deleteResponse.isPending}
                      className="self-start text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {response.response_items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-gray-100 bg-white/70 p-4 shadow-sm sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:border-l-2 sm:border-gray-100 sm:pl-4"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm mb-2 text-gray-900">
                              {item.questions.title}
                            </h4>
                            <div className="text-sm text-gray-700">
                              {renderResponseValue(item)}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs w-fit capitalize">
                            {item.questions.type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
