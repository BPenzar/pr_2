'use client'

import { useState } from 'react'
import { useProjects } from '@/hooks/use-projects'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateProjectModal } from './create-project-modal'
import { PlusIcon, FolderIcon, FileTextIcon, MessageSquareIcon } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export function ProjectList() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { data: projects, isLoading, error } = useProjects()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading projects: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Projects</h2>
        <Button onClick={() => setShowCreateModal(true)}>
          <PlusIcon className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {projects?.length === 0 ? (
        <div className="text-center py-12">
          <FolderIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first project to start collecting feedback
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Create Your First Project
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects?.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FolderIcon className="w-5 h-5 mr-2 text-blue-600" />
                    {project.name}
                  </CardTitle>
                  <CardDescription>
                    {project.description || 'No description'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <FileTextIcon className="w-4 h-4 mr-1 text-gray-400" />
                        <span>{project.forms?.[0]?.count || 0} forms</span>
                      </div>
                      <div className="flex items-center">
                        <MessageSquareIcon className="w-4 h-4 mr-1 text-gray-400" />
                        <span>0 responses</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Created {formatDistanceToNow(new Date(project.created_at))} ago
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => setShowCreateModal(false)}
        />
      )}
    </div>
  )
}