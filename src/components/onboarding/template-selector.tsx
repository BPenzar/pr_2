'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { FORM_TEMPLATES, type FormTemplate } from '@/lib/form-templates'
import { QuestionRenderer } from '@/components/public-form/question-renderer'
import type { Question } from '@/types/database'
import {
  SearchIcon,
  ClockIcon,
  SparklesIcon,
  ArrowLeftIcon,
  ArrowRightIcon
} from 'lucide-react'

interface TemplatePreviewModalProps {
  template: FormTemplate
  onClose: () => void
}

export function TemplatePreviewModal({ template, onClose }: TemplatePreviewModalProps) {
  const mockQuestions = useMemo(() => {
    return template.questions.map((question, index) => {
      const id = `template-${template.id}-q${index}`
      return {
        id,
        form_id: 'template-preview',
        type: question.type,
        title: question.title,
        description: question.description,
        required: question.required,
        options: question.options,
        rating_scale: question.rating_scale,
        order_index: question.order_index,
        created_at: new Date().toISOString(),
      } as Question
    })
  }, [template])

  const [answers, setAnswers] = useState<Record<string, string | string[]>>(() => {
    const initial: Record<string, string | string[]> = {}
    template.questions.forEach((question, index) => {
      const id = `template-${template.id}-q${index}`
      initial[id] = question.type === 'multiselect' ? [] : ''
    })
    return initial
  })

  useEffect(() => {
    const reset: Record<string, string | string[]> = {}
    template.questions.forEach((question, index) => {
      const id = `template-${template.id}-q${index}`
      reset[id] = question.type === 'multiselect' ? [] : ''
    })
    setAnswers(reset)
  }, [template])

  const handleChange = (id: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b bg-white shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl text-gray-900">{template.name}</CardTitle>
              <CardDescription className="text-sm text-gray-600">
                {template.description}
              </CardDescription>
            </div>
            <Button size="sm" variant="ghost" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="max-h-[80vh] overflow-y-auto bg-gray-50 p-6">
          <div className="mb-6 flex items-center gap-3 rounded-md bg-white p-4 shadow-sm">
            <ClockIcon className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              Estimated completion time: {template.estimatedTime}
            </span>
          </div>

          <div className="space-y-6">
            {mockQuestions.map((question) => (
              <div key={question.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <QuestionRenderer
                  question={question}
                  value={answers[question.id] ?? (question.type === 'multiselect' ? [] : '')}
                  onChange={(value) => handleChange(question.id, value)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

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
  const [previewTemplate, setPreviewTemplate] = useState<FormTemplate | null>(null)

  const filteredTemplates = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    const scored = FORM_TEMPLATES.map((template) => {
      let score = 0
      if (businessType && template.businessTypes.includes(businessType)) score += 2
      if (useCase && template.useCases.includes(useCase)) score += 2
      if (template.popular) score += 1
      if (query) {
        const matchesQuery =
          template.name.toLowerCase().includes(query) ||
          template.description.toLowerCase().includes(query) ||
          template.tags.some(tag => tag.toLowerCase().includes(query))
        if (!matchesQuery) return null
        score += 3
      }
      return { template, score }
    }).filter(Boolean) as { template: FormTemplate; score: number }[]

    scored.sort((a, b) => b.score - a.score)
    return scored.map(({ template }) => template)
  }, [businessType, useCase, searchQuery])

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

      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
    </>
  )
}
