'use client'

import { useFormAnalytics, useResponses } from '@/hooks/use-responses'
import { useForm } from '@/hooks/use-forms'
import { useExportResponses, useExportFormStructure } from '@/hooks/use-csv-export'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ResponseChart, QRPerformanceChart, LocationAnalytics } from './response-chart'
import { TrendingUpIcon, Users2Icon, QrCodeIcon, PercentIcon, CalendarIcon, DownloadIcon, FileTextIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { Question } from '@/types/database'

interface AnalyticsDashboardProps {
  formId: string
}

export function AnalyticsDashboard({ formId }: AnalyticsDashboardProps) {
  const { data: analytics, isLoading, error } = useFormAnalytics(formId)
  const { data: responses } = useResponses(formId)
  const { data: form } = useForm(formId)
  const exportResponses = useExportResponses()
  const exportFormStructure = useExportFormStructure()

  const handleExportResponses = async () => {
    if (!responses || !form) return

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

  const handleExportFormStructure = async () => {
    if (!form) return

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

    await exportFormStructure.mutateAsync({ form: exportableForm })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-lg"></div>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-96 bg-gray-200 animate-pulse rounded-lg"></div>
          <div className="h-96 bg-gray-200 animate-pulse rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load analytics: {error?.message || 'Unknown error'}</p>
      </div>
    )
  }

  const {
    form: formData,
    totalResponses,
    totalScans,
    conversionRate,
    dailyResponses,
    qrStats,
    locationStats,
  } = analytics

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <Users2Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalResponses}</div>
            <p className="text-xs text-muted-foreground">
              Feedback submissions received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">QR Scans</CardTitle>
            <QrCodeIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalScans}</div>
            <p className="text-xs text-muted-foreground">
              Total QR code scans
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <PercentIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Scans to responses ratio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Form Age</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDistanceToNow(new Date(formData.created_at))}
            </div>
            <p className="text-xs text-muted-foreground">
              Since creation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DownloadIcon className="w-5 h-5 mr-2" />
            Export Data
          </CardTitle>
          <CardDescription>
            Download your form data and analytics in CSV format
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button
              variant="outline"
              onClick={handleExportResponses}
              disabled={!responses || responses.length === 0 || exportResponses.isPending}
            >
              <DownloadIcon className="w-4 h-4 mr-2" />
              {exportResponses.isPending ? 'Exporting...' : `Export Responses (${totalResponses})`}
            </Button>
            <Button
              variant="outline"
              onClick={handleExportFormStructure}
              disabled={!form || exportFormStructure.isPending}
            >
              <FileTextIcon className="w-4 h-4 mr-2" />
              {exportFormStructure.isPending ? 'Exporting...' : 'Export Form Structure'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Response exports include all submission data and metadata. Form structure exports include question definitions.
          </p>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ResponseChart
          data={dailyResponses}
          title="Response Trends"
          description="Daily responses over the last 30 days"
        />

        {qrStats.length > 0 ? (
          <QRPerformanceChart data={qrStats} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>QR Code Performance</CardTitle>
              <CardDescription>No QR codes created yet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <QrCodeIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Create QR codes to track scan performance</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Location Analytics */}
      <LocationAnalytics data={locationStats} />

      {/* Form Information */}
      <Card>
        <CardHeader>
          <CardTitle>Form Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Form Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span>{formData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Project:</span>
                  <span>{(formData.project as any)?.[0]?.name || 'Unknown Project'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{formatDistanceToNow(new Date(formData.created_at))} ago</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">QR Codes</h4>
              <div className="space-y-2">
                {qrStats.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No QR codes created</p>
                ) : (
                  qrStats.map((qr) => (
                    <div key={qr.id} className="flex justify-between items-center text-sm">
                      <span>{qr.location_name || 'Unnamed Location'}</span>
                      <Badge variant="secondary">
                        {qr.scan_count} scans
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}