'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  SearchIcon,
  ClockIcon,
  StarIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  FileTextIcon,
  FilterIcon
} from 'lucide-react'
import {
  FORM_TEMPLATES,
  getTemplatesForProfile,
  getPopularTemplates,
  getTemplateCategories,
  getTemplatesByCategory,
  type FormTemplate
} from '@/lib/form-templates'

interface TemplateSelectorProps {
  businessType?: string
  useCase?: string
  onSelectTemplate: (template: FormTemplate) => void
  onBack?: () => void
  onSkip?: () => void
}

export function TemplateSelector({
  businessType,
  useCase,
  onSelectTemplate,
  onBack,
  onSkip
}: TemplateSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [previewTemplate, setPreviewTemplate] = useState<FormTemplate | null>(null)

  const categories = getTemplateCategories()
  const allTemplates = FORM_TEMPLATES
  const recommendedTemplates = getTemplatesForProfile(businessType, useCase)
  const popularTemplates = getPopularTemplates()

  const getFilteredTemplates = (templates: FormTemplate[]) => {
    let filtered = templates

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = getTemplatesByCategory(selectedCategory)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    return filtered
  }

  const TemplateCard = ({ template }: { template: FormTemplate }) => (
    <Card className="cursor-pointer transition-all hover:shadow-md group">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <CardTitle className="text-lg">{template.name}</CardTitle>
              {template.popular && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                  <StarIcon className="w-3 h-3 mr-1" />
                  Popular
                </Badge>
              )}
            </div>
            <CardDescription className="text-sm">{template.description}</CardDescription>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <ClockIcon className="w-3 h-3" />
            <span>{template.estimatedTime}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {template.category}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {template.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{template.tags.length - 3} more
              </Badge>
            )}
          </div>

          <div className="text-sm text-gray-600">
            <strong>{template.questions.length}</strong> questions
          </div>

          <div className="flex space-x-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setPreviewTemplate(template)
              }}
              className="flex-1"
            >
              Preview
            </Button>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onSelectTemplate(template)
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Use Template
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const TemplatePreview = ({ template }: { template: FormTemplate }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreviewTemplate(null)}
            >
              ✕
            </Button>
          </div>
        </CardHeader>

        <CardContent className="overflow-y-auto max-h-[60vh]">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>📝 {template.questions.length} questions</span>
              <span>⏱️ {template.estimatedTime}</span>
            </div>

            <div className="space-y-3">
              {template.questions.map((question, index) => (
                <Card key={index} className="p-3 bg-gray-50">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">
                        {index + 1}. {question.title}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {question.type}
                        </Badge>
                        {question.required && (
                          <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">
                            Required
                          </Badge>
                        )}
                      </div>
                    </div>

                    {question.description && (
                      <p className="text-xs text-gray-600">{question.description}</p>
                    )}

                    {question.options && (
                      <div className="text-xs text-gray-500">
                        Options: {question.options.join(', ')}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setPreviewTemplate(null)}
                className="flex-1"
              >
                Close Preview
              </Button>
              <Button
                onClick={() => {
                  setPreviewTemplate(null)
                  onSelectTemplate(template)
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Use This Template
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Choose a Template</h1>
                <p className="text-gray-600">
                  Start with a pre-built form template or create your own
                </p>
              </div>
              <div className="flex space-x-2">
                {onBack && (
                  <Button variant="outline" onClick={onBack}>
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                )}
                {onSkip && (
                  <Button variant="ghost" onClick={onSkip}>
                    Skip & Create Custom
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search templates by name, description, or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <FilterIcon className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Template Tabs */}
            <Tabs defaultValue="recommended" className="space-y-6">
              <TabsList>
                <TabsTrigger value="recommended">
                  Recommended ({recommendedTemplates.length})
                </TabsTrigger>
                <TabsTrigger value="popular">
                  Popular ({popularTemplates.length})
                </TabsTrigger>
                <TabsTrigger value="all">
                  All Templates ({allTemplates.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="recommended" className="space-y-4">
                {businessType && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-medium text-blue-900 mb-1">
                      Recommended for your business type
                    </h3>
                    <p className="text-sm text-blue-700">
                      These templates are specifically designed for your industry and use case.
                    </p>
                  </div>
                )}

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {getFilteredTemplates(recommendedTemplates).map(template => (
                    <TemplateCard key={template.id} template={template} />
                  ))}
                </div>

                {getFilteredTemplates(recommendedTemplates).length === 0 && (
                  <div className="text-center py-12">
                    <FileTextIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No templates found</h3>
                    <p className="text-gray-600">
                      Try adjusting your search or browse all templates.
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="popular" className="space-y-4">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {getFilteredTemplates(popularTemplates).map(template => (
                    <TemplateCard key={template.id} template={template} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="all" className="space-y-4">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {getFilteredTemplates(allTemplates).map(template => (
                    <TemplateCard key={template.id} template={template} />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Template Preview Modal */}
      {previewTemplate && <TemplatePreview template={previewTemplate} />}
    </>
  )
}