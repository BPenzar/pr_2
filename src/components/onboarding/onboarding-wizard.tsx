'use client'

import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { FORM_TEMPLATES, type FormTemplate } from '@/lib/form-templates'
import { TemplatePreviewModal } from '@/components/onboarding/template-selector'
import {
  ArrowLeft as ArrowLeftIcon,
  ArrowRight as ArrowRightIcon,
  Building2 as BuildingIcon,
  Check as CheckIcon,
  ClipboardList as ClipboardListIcon,
  FileText as FileTextIcon,
  HeartPulse as HeartPulseIcon,
  Sparkles as SparklesIcon,
  Store as StoreIcon,
  Users as UsersIcon,
  UtensilsCrossed as UtensilsIcon,
  ListChecks as ListChecksIcon
} from 'lucide-react'

export interface OnboardingData {
  projectName: string
  businessType: string
  primaryUseCase: string
  setupOption: 'template' | 'quick' | 'guided'
  selectedTemplate?: string
}

export interface OnboardingFormState {
  projectName: string
  businessType: string
  primaryUseCase: string
  setupOption: 'template' | 'quick' | 'guided' | ''
}

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => void
  onSkip?: () => void
  selectedTemplate: FormTemplate | null
  onSelectTemplate: (template: FormTemplate | null) => void
  onOpenTemplateLibrary?: () => void
  isSubmitting?: boolean
  onStateChange?: (state: OnboardingFormState) => void
}

const businessOptions = [
  { id: 'restaurant', label: 'Restaurant / Hospitality', icon: UtensilsIcon },
  { id: 'retail', label: 'Retail / Shop', icon: StoreIcon },
  { id: 'corporate', label: 'Office / Corporate', icon: BuildingIcon },
  { id: 'healthcare', label: 'Healthcare / Wellness', icon: HeartPulseIcon },
  { id: 'other', label: 'Other / Custom', icon: ClipboardListIcon },
]

const useCaseOptions = [
  { id: 'customer_satisfaction', label: 'Customer satisfaction' },
  { id: 'product_feedback', label: 'Product feedback' },
  { id: 'event_feedback', label: 'Event / experience feedback' },
  { id: 'employee_engagement', label: 'Employee / team pulse' },
  { id: 'market_research', label: 'Market research' },
]

const formSchema = z.object({
  projectName: z.string().min(1, 'Please enter a project name.'),
  businessType: z.string().min(1, 'Please select a business type.'),
  primaryUseCase: z.string().min(1, 'Please select what you want to measure.'),
  setupOption: z.enum(['template', 'quick', 'guided']),
  selectedTemplate: z.string().optional(),
})

export function OnboardingWizard({
  onComplete,
  onSkip,
  selectedTemplate,
  onSelectTemplate,
  onOpenTemplateLibrary,
  isSubmitting = false,
  onStateChange,
}: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [projectName, setProjectName] = useState('Customer Feedback Project')
  const [businessType, setBusinessType] = useState('')
  const [primaryUseCase, setPrimaryUseCase] = useState('')
  const [setupOption, setSetupOption] = useState<'template' | 'quick' | 'guided' | ''>('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [previewTemplate, setPreviewTemplate] = useState<FormTemplate | null>(null)
  const steps = ['Project basics', 'Goal', 'Form setup']
  const progress = ((currentStep + 1) / steps.length) * 100

  const recommendedTemplates = useMemo(() => {
    if (!businessType && !primaryUseCase) {
      return FORM_TEMPLATES.slice(0, 4)
    }
    return FORM_TEMPLATES.filter((template) => {
      const matchesBusiness = businessType ? template.businessTypes.includes(businessType) : false
      const matchesUseCase = primaryUseCase ? template.useCases.includes(primaryUseCase) : false
      return matchesBusiness || matchesUseCase
    })
  }, [businessType, primaryUseCase])

  useEffect(() => {
    onStateChange?.({ projectName, businessType, primaryUseCase, setupOption })
  }, [projectName, businessType, primaryUseCase, setupOption, onStateChange])

  useEffect(() => {
    setErrors({})
  }, [currentStep])

  const handleNext = () => {
    if (currentStep === 0) {
      if (!projectName.trim()) {
        setErrors({ projectName: 'Project name is required.' })
        return
      }
      if (!businessType) {
        setErrors({ businessType: 'Select the option that describes you best.' })
        return
      }
    }

    if (currentStep === 1) {
      if (!primaryUseCase) {
        setErrors({ primaryUseCase: 'Choose the outcome you want to focus on first.' })
        return
      }
    }

    if (currentStep === 2) {
      if (!setupOption) {
        setErrors({ setupOption: 'Pick how you want to start.' })
        return
      }

      const chosenSetup = (setupOption || 'guided') as 'template' | 'quick' | 'guided'
      const payload: OnboardingData = {
        projectName: projectName.trim(),
        businessType,
        primaryUseCase,
        setupOption: chosenSetup,
        selectedTemplate: chosenSetup === 'template' ? selectedTemplate?.id : undefined,
      }

      const result = formSchema.safeParse(payload)
      if (!result.success) {
        const fieldErrors: Record<string, string> = {}
        result.error.issues.forEach((issue) => {
          const field = issue.path[0]
          if (typeof field === 'string') {
            fieldErrors[field] = issue.message
          }
        })
        if (setupOption === 'template' && !selectedTemplate) {
          fieldErrors.selectedTemplate = 'Select a template or choose another option.'
        }
        setErrors(fieldErrors)
        return
      }

      onComplete(payload)
      return
    }

    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  return (
    <div className="max-w-3xl mx-auto min-h-[80vh] py-10 px-4 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </p>
          <h1 className="text-2xl font-semibold text-gray-900 mt-1">Let's set up your workspace</h1>
        </div>
        {onSkip && (
          <Button variant="ghost" size="sm" onClick={onSkip} disabled={isSubmitting}>
            Skip for now
          </Button>
        )}
      </div>

      <Progress value={progress} className="h-2" />

      {currentStep === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Project basics</CardTitle>
            <CardDescription>Give your project a clear name and tell us who it's for.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="projectName">Project name</Label>
              <Input
                id="projectName"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder="e.g. Guest feedback hub"
                disabled={isSubmitting}
              />
              {errors.projectName && <p className="text-sm text-red-600">{errors.projectName}</p>}
            </div>

            <div className="space-y-3">
              <Label>Which description fits best?</Label>
              <div className="grid gap-3 md:grid-cols-2">
                {businessOptions.map((option) => {
                  const Icon = option.icon
                  const isSelected = businessType === option.id
                  return (
                    <button
                      type="button"
                      key={option.id}
                      onClick={() => setBusinessType(option.id)}
                      className={`rounded-lg border p-4 text-left transition hover:shadow-sm ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                      disabled={isSubmitting}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`rounded-full p-2 ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <p className="font-medium text-gray-900">{option.label}</p>
                        {isSelected && <CheckIcon className="h-4 w-4 text-blue-500 ml-auto" />}
                      </div>
                    </button>
                  )
                })}
              </div>
              {errors.businessType && <p className="text-sm text-red-600">{errors.businessType}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>What do you want to measure first?</CardTitle>
            <CardDescription>Your answer helps us recommend templates and best practices.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              {useCaseOptions.map((option) => {
                const isSelected = primaryUseCase === option.id
                return (
                  <button
                    type="button"
                    key={option.id}
                    onClick={() => setPrimaryUseCase(option.id)}
                    className={`rounded-lg border p-4 text-left transition hover:shadow-sm ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                    disabled={isSubmitting}
                  >
                    <div className="flex items-center gap-3">
                      <ListChecksIcon className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium text-gray-900">{option.label}</p>
                      {isSelected && <CheckIcon className="h-4 w-4 text-blue-500 ml-auto" />}
                    </div>
                  </button>
                )
              })}
            </div>
            {errors.primaryUseCase && <p className="text-sm text-red-600">{errors.primaryUseCase}</p>}
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Create your first form</CardTitle>
            <CardDescription>Choose how you want to get started. You can always edit later.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 md:grid-cols-3">
              <button
                type="button"
                onClick={() => setSetupOption('template')}
                className={`rounded-lg border p-4 text-left transition hover:shadow-sm ${setupOption === 'template' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                disabled={isSubmitting}
              >
                <div className="flex items-center gap-3">
                  <SparklesIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-gray-900">Use a template</p>
                    <p className="text-sm text-muted-foreground">Pick a ready-to-go template tailored to your goal.</p>
                  </div>
                  {setupOption === 'template' && <CheckIcon className="h-4 w-4 text-blue-500 ml-auto" />}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSetupOption('quick')}
                className={`rounded-lg border p-4 text-left transition hover:shadow-sm ${setupOption === 'quick' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                disabled={isSubmitting}
              >
                <div className="flex items-center gap-3">
                  <UsersIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-gray-900">Quick start</p>
                    <p className="text-sm text-muted-foreground">Generate a simple feedback form you can tweak later.</p>
                  </div>
                  {setupOption === 'quick' && <CheckIcon className="h-4 w-4 text-blue-500 ml-auto" />}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSetupOption('guided')}
                className={`rounded-lg border p-4 text-left transition hover:shadow-sm ${setupOption === 'guided' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                disabled={isSubmitting}
              >
                <div className="flex items-center gap-3">
                  <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-gray-900">Start from scratch</p>
                    <p className="text-sm text-muted-foreground">Build your form question by question.</p>
                  </div>
                  {setupOption === 'guided' && <CheckIcon className="h-4 w-4 text-blue-500 ml-auto" />}
                </div>
              </button>
            </div>
            {errors.setupOption && <p className="text-sm text-red-600">{errors.setupOption}</p>}

            {setupOption === 'template' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-800">Recommended templates</h3>
                  <Button variant="outline" size="sm" onClick={onOpenTemplateLibrary} disabled={isSubmitting}>
                    Browse all templates
                  </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {recommendedTemplates.slice(0, 4).map((template) => {
                    const isActive = selectedTemplate?.id === template.id
                    return (
                      <Card key={template.id} className={isActive ? 'border-blue-500 ring-2 ring-blue-100' : ''}>
                        <CardHeader className="space-y-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{template.name}</CardTitle>
                            <Badge>{template.category}</Badge>
                          </div>
                          <CardDescription>{template.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="text-xs text-muted-foreground">
                            Estimated time: {template.estimatedTime}
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => onSelectTemplate(template)} disabled={isSubmitting}>
                              {isActive ? 'Selected' : 'Use template'}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setPreviewTemplate(template)} disabled={isSubmitting}>
                              Preview
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                  {recommendedTemplates.length === 0 && (
                    <p className="text-sm text-muted-foreground">No direct matches yet. Browse the full library to explore more templates.</p>
                  )}
                </div>
                {setupOption === 'template' && !selectedTemplate && (
                  <p className="text-sm text-red-600">Select a template or choose another setup option.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={handleBack} disabled={currentStep === 0 || isSubmitting}>
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          {currentStep === steps.length - 1 && setupOption === 'template' && selectedTemplate && (
            <Button variant="outline" size="sm" onClick={() => setPreviewTemplate(selectedTemplate)} disabled={isSubmitting}>
              Preview
            </Button>
          )}
          <Button onClick={handleNext} disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : currentStep === steps.length - 1 ? 'Create project' : 'Continue'}
            <ArrowRightIcon className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
    </div>
  )
}
