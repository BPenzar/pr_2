'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useForm } from '@/hooks/use-forms'
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard'
import { ResponseViewer } from '@/components/analytics/response-viewer'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { ArrowLeftIcon, BarChart3Icon, TableIcon } from 'lucide-react'

export default function FormAnalyticsPage() {
  const params = useParams()
  const formId = params.id as string
  const { data: form, isLoading } = useForm(formId)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading analytics...</div>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Form not found</h2>
          <p className="text-gray-600 mb-4">
            The form you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link href={`/forms/${formId}`}>
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Form Builder
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
              <p className="text-gray-600">Insights for {form.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center">
              <BarChart3Icon className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="responses" className="flex items-center">
              <TableIcon className="w-4 h-4 mr-2" />
              Responses
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AnalyticsDashboard formId={formId} />
          </TabsContent>

          <TabsContent value="responses">
            <ResponseViewer formId={formId} formName={form.name} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}