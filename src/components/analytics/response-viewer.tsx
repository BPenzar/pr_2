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
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-800">{rating}</span>
          <div className="flex gap-1">
            {[...Array(maxScale)].map((_, index) => {
              const valueLabel = index + 1
              const isSelected = valueLabel === rating
              return (
                <span
                  key={valueLabel}
                  className={`h-6 w-6 flex items-center justify-center rounded-full text-xs border ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-gray-300 text-gray-600'
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
      return <Badge variant="outline">{value}</Badge>
    }

    if (questions.type === 'textarea') {
      return (
        <div className="max-w-xs">
          <p className="text-sm text-gray-700 line-clamp-3">{value}</p>
        </div>
      )
    }

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
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Responses</CardTitle>
              <CardDescription>
                {responses?.length || 0} responses for {formName}
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <FilterIcon className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={!responses || responses.length === 0 || exportResponses.isPending}
              >
                <DownloadIcon className="w-4 h-4 mr-2" />
                {exportResponses.isPending ? 'Exporting...' : 'Export CSV'}
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
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>
                          {relativeSubmitted} ago
                        </span>
                        {response.qr_codes?.location_name && (
                          <>
                            <span>•</span>
                            <Badge variant="secondary" className="text-xs">
                              {response.qr_codes.location_name}
                            </Badge>
                          </>
                        )}
                        {response.qr_codes?.short_url && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-xs">
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
                    className="text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {response.response_items.map((item) => (
                    <div key={item.id} className="border-l-2 border-gray-100 pl-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm mb-2">
                            {item.questions.title}
                          </h4>
                          <div className="text-sm">
                            {renderResponseValue(item)}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs ml-2">
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
