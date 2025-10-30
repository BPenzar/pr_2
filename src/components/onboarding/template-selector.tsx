'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { FORM_TEMPLATES, type FormTemplate } from '@/lib/form-templates'
import {
  SearchIcon,
  ClockIcon,
  SparklesIcon,
  ArrowLeftIcon,
  ArrowRightIcon
} from 'lucide-react'

interface TemplateSelectorProps {
  businessType?: string
  useCase?: string
  onSelectTemplate: (template: FormTemplate) => void
  onBack?: () => void
  onSkip?: () => void
}

export function TemplateSelector({
  onSelectTemplate,
  onBack,
  onSkip
}: TemplateSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [previewTemplate, setPreviewTemplate] = useState<FormTemplate | null>(null)

  const filteredTemplates = FORM_TEMPLATES.filter(template => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      template.name.toLowerCase().includes(query) ||
      template.description.toLowerCase().includes(query) ||
      template.tags.some(tag => tag.toLowerCase().includes(query))
    )
  })

  const TemplatePreview = ({ template }: { template: FormTemplate }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card className="w-full max-w-2xl max-h-[85vh] overflow-hidden">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl">{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setPreviewTemplate(null)}>
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="max-h-[70vh] space-y-4 overflow-y-auto">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <ClockIcon className="h-4 w-4" />
            <span>{template.estimatedTime}</span>
          </div>
          <div className="space-y-3">
            {template.questions.map((question, index) => (
              <Card key={index} className="border border-gray-100 bg-gray-50">
                <CardContent className="space-y-2 p-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-800">
                      {index + 1}. {question.title}
                    </h4>
                    <Badge variant="outline" className="text-xs capitalize">
                      {question.type}
                    </Badge>
                  </div>
                  {question.description && (
                    <p className="text-xs text-gray-600">{question.description}</p>
                  )}
                  {question.options && (
                    <p className="text-xs text-gray-500">
                      Options: {question.options.join(', ')}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              {onBack && (
                <Button variant="outline" size="sm" onClick={onBack}>
                  <ArrowLeftIcon className="h-4 w-4" />
                </Button>
              )}
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Choose a template</h1>
                <p className="text-sm text-gray-600">
                  Start with a ready-made template. You can add, remove, or edit questions at any time.
                </p>
              </div>
            </div>
            {onSkip && (
              <Button variant="ghost" onClick={onSkip}>
                Skip guided setup
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search templates by name, use case, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-6">
            {filteredTemplates.map((template, index) => {
              const isPrimary = index === 0

              return (
                <Card
                  key={template.id}
                  className={`border ${isPrimary ? 'border-blue-200 bg-blue-50/50 shadow-sm' : 'border-gray-100'} transition hover:shadow-md`}
                >
                  <CardHeader className="gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isPrimary && (
                          <Badge className="bg-blue-600 text-white">
                            <SparklesIcon className="mr-1 h-3 w-3" />
                            Recommended
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs capitalize text-gray-500">
                          {template.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <ClockIcon className="h-4 w-4" />
                        <span>{template.estimatedTime}</span>
                      </div>
                    </div>
                    <CardTitle className="text-xl text-gray-900">{template.name}</CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.25em] text-gray-500">
                        Outline
                      </p>
                      <ul className="space-y-1 text-sm text-gray-700">
                        {template.questions.map((question, qIndex) => (
                          <li key={qIndex} className="flex items-start gap-2">
                            <span className="mt-0.5 text-xs text-gray-400">{qIndex + 1}.</span>
                            <span>{question.title}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {template.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs capitalize">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                      <Button className="sm:flex-1" onClick={() => onSelectTemplate(template)}>
                        Use this template
                      </Button>
                      <Button
                        variant="outline"
                        className="sm:flex-1"
                        onClick={() => setPreviewTemplate(template)}
                      >
                        Preview questions
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {filteredTemplates.length === 0 && (
              <div className="rounded-lg border border-dashed border-gray-200 p-10 text-center text-sm text-gray-600">
                No templates match your search yet. Try a different keyword.
              </div>
            )}
          </div>
        </div>
      </div>

      {previewTemplate && <TemplatePreview template={previewTemplate} />}
    </>
  )
}
