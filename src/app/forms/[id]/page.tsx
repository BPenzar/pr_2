'use client'

import { useCallback, useState } from 'react'
import { useParams } from 'next/navigation'
import { useForm } from '@/hooks/use-forms'
import { FormBuilder } from '@/components/forms/form-builder'
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard'
import { ResponseAnalytics } from '@/components/analytics/response-analytics'
import { ResponseViewer } from '@/components/analytics/response-viewer'
import { QRCodeList } from '@/components/qr/qr-code-list'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeftIcon, SettingsIcon, EyeIcon, LayoutDashboard, Wrench, Table, QrCode } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

export default function FormBuilderPage() {
  const params = useParams()
  const formId = params.id as string
  const { data: form, isLoading } = useForm(formId)
  const [activeTab, setActiveTab] = useState<'response-analytics' | 'qr-analytics' | 'builder' | 'responses' | 'qr-codes'>('response-analytics')
  const queryClient = useQueryClient()

  const handleTabChange = useCallback((value: string) => {
    const nextTab = value as typeof activeTab
    setActiveTab(nextTab)

    if (nextTab === 'response-analytics' || nextTab === 'qr-analytics' || nextTab === 'responses') {
      queryClient.invalidateQueries({ queryKey: ['responses', formId] })
    }

    if (nextTab === 'response-analytics' || nextTab === 'qr-analytics') {
      queryClient.invalidateQueries({ queryKey: ['form-analytics', formId] })
    }
  }, [formId, queryClient])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading form...</div>
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
          <div className="flex flex-col gap-4 py-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Form Builder</h1>
              <p className="text-gray-600">Build and customize your feedback form</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/projects/${form.project.id}`}>
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Back to Project
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/forms/${formId}/settings`}>
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  Form Settings
                </Link>
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white border-none"
                asChild
              >
                <Link href={`/forms/${formId}/preview`}>
                  <EyeIcon className="w-4 h-4 mr-2" />
                  Preview Form
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="space-y-6"
        >
          <TabsList className="flex flex-wrap gap-2 mb-3 sm:mb-4">
            <TabsTrigger value="response-analytics" className="flex items-center gap-2 whitespace-nowrap">
              <LayoutDashboard className="w-4 h-4" />
              Response Analytics
            </TabsTrigger>
            <TabsTrigger value="qr-analytics" className="flex items-center gap-2 whitespace-nowrap">
              <LayoutDashboard className="w-4 h-4" />
              QR Analytics
            </TabsTrigger>
            <TabsTrigger value="builder" className="flex items-center gap-2 whitespace-nowrap">
              <Wrench className="w-4 h-4" />
              Form Builder
            </TabsTrigger>
            <TabsTrigger value="responses" className="flex items-center gap-2 whitespace-nowrap">
              <Table className="w-4 h-4" />
              Responses
            </TabsTrigger>
            <TabsTrigger value="qr-codes" className="flex items-center gap-2 whitespace-nowrap">
              <QrCode className="w-4 h-4" />
              QR Codes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="response-analytics" className="space-y-6 pt-4 sm:pt-6">
            {activeTab === 'response-analytics' && <ResponseAnalytics formId={formId} />}
          </TabsContent>

          <TabsContent value="qr-analytics" className="space-y-6 pt-4 sm:pt-6">
            {activeTab === 'qr-analytics' && <AnalyticsDashboard formId={formId} />}
          </TabsContent>

          <TabsContent value="builder" className="space-y-6 pt-4 sm:pt-6">
            {activeTab === 'builder' && <FormBuilder formId={formId} />}
          </TabsContent>

          <TabsContent value="responses" className="space-y-6 pt-4 sm:pt-6">
            {activeTab === 'responses' && <ResponseViewer formId={formId} formName={form.name} />}
          </TabsContent>

          <TabsContent value="qr-codes" className="space-y-6 pt-4 sm:pt-6">
            {activeTab === 'qr-codes' && <QRCodeList formId={formId} formName={form.name} />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
