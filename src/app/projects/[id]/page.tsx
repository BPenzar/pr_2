'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useProject } from '@/hooks/use-projects'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { CreateFormModal } from '@/components/forms/create-form-modal'
import Link from 'next/link'
import { ArrowLeftIcon, PlusIcon, FileTextIcon, MessageSquareIcon, QrCodeIcon, SettingsIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const [showCreateFormModal, setShowCreateFormModal] = useState(false)
  const { data: project, isLoading, error } = useProject(projectId)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading project...</div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Project not found</h2>
          <p className="text-gray-600 mb-4">
            The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  const totalResponses = project.forms?.reduce((sum: number, form: any) =>
    sum + (form.responses?.[0]?.count || 0), 0) || 0

  const handleFormCreated = (formId: string) => {
    router.push(`/forms/${formId}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                <p className="text-gray-600">{project.description || 'No description'}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <SettingsIcon className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button size="sm" onClick={() => setShowCreateFormModal(true)}>
                <PlusIcon className="w-4 h-4 mr-2" />
                New Form
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Project Stats */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Forms</CardTitle>
              <FileTextIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{project.forms?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Active forms in this project
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Responses</CardTitle>
              <MessageSquareIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalResponses}</div>
              <p className="text-xs text-muted-foreground">
                Total feedback received
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">QR Codes</CardTitle>
              <QrCodeIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Generated QR codes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Forms List */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Forms</CardTitle>
                <CardDescription>
                  Manage your feedback forms for this project
                </CardDescription>
              </div>
              <Button onClick={() => setShowCreateFormModal(true)}>
                <PlusIcon className="w-4 h-4 mr-2" />
                Create Form
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!project.forms || project.forms.length === 0 ? (
              <div className="text-center py-12">
                <FileTextIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No forms yet</h3>
                <p className="text-gray-600 mb-6">
                  Create your first form to start collecting feedback for this project
                </p>
                <Button onClick={() => setShowCreateFormModal(true)}>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create Your First Form
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {project.forms?.map((form: any) => (
                  <div key={form.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold">{form.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {form.description || 'No description'}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>{form.responses?.[0]?.count || 0} responses</span>
                          <span>•</span>
                          <span>Created {formatDistanceToNow(new Date(form.created_at))} ago</span>
                          <span>•</span>
                          <span className={form.is_active ? 'text-green-600' : 'text-red-600'}>
                            {form.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Link href={`/forms/${form.id}`}>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </Link>
                        <Link href={`/forms/${form.id}/analytics`}>
                          <Button variant="outline" size="sm">
                            Analytics
                          </Button>
                        </Link>
                        <Link href={`/forms/${form.id}/qr`}>
                          <Button variant="outline" size="sm">
                            QR Code
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Info */}
        <Card>
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-sm font-medium">Created</Label>
                <p className="text-sm text-gray-600">
                  {formatDistanceToNow(new Date(project.created_at))} ago
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Last Updated</Label>
                <p className="text-sm text-gray-600">
                  {formatDistanceToNow(new Date(project.updated_at))} ago
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showCreateFormModal && (
        <CreateFormModal
          projectId={projectId}
          onClose={() => setShowCreateFormModal(false)}
          onSuccess={handleFormCreated}
        />
      )}
    </div>
  )
}