'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { FORM_TEMPLATES, type FormTemplate } from '@/lib/form-templates'
import { TemplatePreviewModal } from '@/components/onboarding/template-selector'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BarChart3Icon,
  BuildingIcon,
  CheckIcon,
  CoffeeIcon,
  FileTextIcon,
  HeartIcon,
  SparklesIcon,
  Users2Icon,
  QrCodeIcon,
  ShoppingBagIcon
} from 'lucide-react'

type SetupOption = 'quick' | 'guided' | 'template'

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => void
  onSkip?: () => void
  onOpenTemplateLibrary?: () => void
  selectedTemplate: FormTemplate | null
  onSelectTemplate: (template: FormTemplate | null) => void
  isSubmitting?: boolean
  onStateChange?: (state: OnboardingFormState) => void
}

export interface OnboardingData {
  businessType: string
  primaryUseCase: string
  expectedVolume: string
  setupOption: SetupOption
  projectName: string
  selectedTemplate?: string
}

export interface OnboardingFormState {
  businessType: string
  primaryUseCase: string
  expectedVolume: string
  projectName: string
  setupOption: SetupOption | null
}

const BUSINESS_TYPE_NAMES: Record<string, string> = {
  restaurant: 'Guest Feedback Hub',
  retail: 'Store Feedback Hub',
  corporate: 'Team Insights Hub',
  healthcare: 'Patient Experience Hub',
  other: 'Customer Feedback Hub'
}

const BUSINESS_TYPES = [
  {
    id: 'restaurant',
    name: 'Restaurant / Food Service',
    icon: CoffeeIcon,
    description: 'Capture feedback on meals, service, and ambiance in minutes.'
  },
  {
    id: 'retail',
    name: 'Retail / E-commerce',
    icon: ShoppingBagIcon,
    description: 'Measure product satisfaction and in-store experience.'
  },
  {
    id: 'corporate',
    name: 'Corporate / Office',
    icon: BuildingIcon,
    description: 'Collect employee sentiment, event feedback, and internal surveys.'
  },
  {
    id: 'healthcare',
    name: 'Healthcare / Wellness',
    icon: HeartIcon,
    description: 'Understand patient experience after visits or treatments.'
  },
  {
    id: 'other',
    name: 'Something else',
    icon: Users2Icon,
    description: 'Create a custom feedback flow for your unique use case.'
  }
]

const USE_CASES = [
  {
    id: 'customer_satisfaction',
    name: 'Customer Satisfaction',
    description: 'Track how happy people are with your overall service.'
  },
  {
    id: 'product_feedback',
    name: 'Product Feedback',
    description: 'Discover what people think about specific products or features.'
  },
  {
    id: 'event_feedback',
    name: 'Event Feedback',
    description: 'Collect reactions right after workshops, meetups, or trainings.'
  },
  {
    id: 'employee_engagement',
    name: 'Employee Engagement',
    description: 'Run quick internal check-ins and pulse surveys.'
  },
  {
    id: 'market_research',
    name: 'Market Research',
    description: 'Validate ideas and understand audience preferences.'
  }
]

const VOLUME_OPTIONS = [
  {
    id: 'low',
    name: 'Just getting started',
    description: 'Less than 100 responses each month.',
    recommendation: 'Perfect for the Free plan.'
  },
  {
    id: 'medium',
    name: 'Growing momentum',
    description: 'Between 100 and 1,000 responses per month.',
    recommendation: 'Pro plan keeps you covered.'
  },
  {
    id: 'high',
    name: 'High-volume feedback',
    description: 'More than 1,000 responses per month.',
    recommendation: 'Chat with us about scaling confidently.'
  }
]

const SETUP_OPTIONS: Array<{
  id: SetupOption
  name: string
  description: string
  icon: typeof SparklesIcon
  duration: string
}> = [
  {
    id: 'quick',
    name: 'Quick start',
    description: 'Auto-create a simple form so you can start collecting responses immediately.',
    icon: SparklesIcon,
    duration: '≈2 minutes'
  },
  {
    id: 'template',
    name: 'Use a template',
    description: 'Pick a best-practice template tailored to your business type.',
    icon: FileTextIcon,
    duration: '≈5 minutes'
  },
  {
    id: 'guided',
    name: 'Build from scratch',
    description: 'Start with a blank slate and customise every question yourself.',
    icon: Users2Icon,
    duration: '≈10 minutes'
  }
]

export function OnboardingWizard({
  onComplete,
  onSkip,
  onOpenTemplateLibrary,
  selectedTemplate,
  onSelectTemplate,
  isSubmitting = false,
  onStateChange
}: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [projectNameEdited, setProjectNameEdited] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<FormTemplate | null>(null)
  const [formState, setFormState] = useState<OnboardingFormState>({
    businessType: '',
    primaryUseCase: '',
    expectedVolume: '',
    projectName: 'My Feedback Project',
    setupOption: null
  })

  const steps = ['Your business', 'Goals', 'Get started']
  const progress = ((currentStep + 1) / steps.length) * 100

  const recommendedTemplates = useMemo(() => {
    const matches = FORM_TEMPLATES.filter((template) => {
      const matchesBusiness = formState.businessType
        ? template.businessTypes.includes(formState.businessType)
        : false
      const matchesUseCase = formState.primaryUseCase
        ? template.useCases.includes(formState.primaryUseCase)
        : false
      return matchesBusiness || matchesUseCase
    })

    if (matches.length > 0) {
      return matches
    }

    return FORM_TEMPLATES.filter((template) => template.popular).concat(
      FORM_TEMPLATES.slice(0, 3)
    )
  }, [formState.businessType, formState.primaryUseCase])

  const handleBusinessTypeSelect = (typeId: string) => {
    setFormState((prev) => {
      const projectName =
        projectNameEdited || !BUSINESS_TYPE_NAMES[typeId]
          ? prev.projectName
          : BUSINESS_TYPE_NAMES[typeId]

      return {
        ...prev,
        businessType: typeId,
        projectName
      }
    })
  }

  const handleSetupOptionSelect = (option: SetupOption) => {
    setFormState((prev) => ({
      ...prev,
      setupOption: option
    }))

    if (option !== 'template' && selectedTemplate) {
      onSelectTemplate(null)
    }
  }

  useEffect(() => {
    onStateChange?.(formState)
  }, [formState, onStateChange])

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return Boolean(formState.businessType && formState.projectName.trim())
      case 1:
        return Boolean(formState.primaryUseCase && formState.expectedVolume)
      case 2:
        if (!formState.setupOption) return false
        if (formState.setupOption === 'template') {
          return Boolean(selectedTemplate)
        }
        return true
      default:
        return true
    }
  }

  const goNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1)
      return
    }

    if (!formState.setupOption) return

    onComplete({
      businessType: formState.businessType,
      primaryUseCase: formState.primaryUseCase,
      expectedVolume: formState.expectedVolume,
      setupOption: formState.setupOption,
      projectName: formState.projectName.trim(),
      selectedTemplate: formState.setupOption === 'template' ? selectedTemplate?.id : undefined
    })
  }

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900">Tell us about your business</h2>
              <p className="text-sm text-gray-600 mt-2">
                We tailor recommendations based on the experience you want to improve.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {BUSINESS_TYPES.map((type) => {
                const Icon = type.icon
                const isSelected = formState.businessType === type.id

                return (
                  <Card
                    key={type.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? 'ring-2 ring-blue-500 border-blue-200 bg-blue-50/40' : ''
                    }`}
                    onClick={() => handleBusinessTypeSelect(type.id)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-blue-100 p-2">
                          <Icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="font-medium text-gray-900">{type.name}</h3>
                            {isSelected && <CheckIcon className="h-5 w-5 text-blue-600" />}
                          </div>
                          <p className="text-sm text-gray-600">{type.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold text-gray-900">
                  Name your first project
                </CardTitle>
                <CardDescription>
                  You can always rename it later. This is how your workspace will appear on the dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  value={formState.projectName}
                  onChange={(event) => {
                    setFormState((prev) => ({
                      ...prev,
                      projectName: event.target.value
                    }))
                    setProjectNameEdited(true)
                  }}
                  placeholder="e.g. Guest Feedback Hub"
                />
              </CardContent>
            </Card>
          </div>
        )

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900">What&apos;s your first goal?</h2>
              <p className="text-sm text-gray-600 mt-2">
                Pick the outcome you want from your feedback. We&apos;ll fine-tune recommendations accordingly.
              </p>
            </div>

            <div className="space-y-3">
              {USE_CASES.map((useCase) => {
                const isSelected = formState.primaryUseCase === useCase.id

                return (
                  <Card
                    key={useCase.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? 'ring-2 ring-blue-500 border-blue-200 bg-blue-50/40' : ''
                    }`}
                    onClick={() =>
                      setFormState((prev) => ({
                        ...prev,
                        primaryUseCase: useCase.id
                      }))
                    }
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-medium text-gray-900">{useCase.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{useCase.description}</p>
                        </div>
                        {isSelected && <CheckIcon className="h-5 w-5 text-blue-600" />}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <BarChart3Icon className="h-4 w-4 text-blue-600" />
                Expected response volume
              </h3>
              {VOLUME_OPTIONS.map((option) => {
                const isSelected = formState.expectedVolume === option.id

                return (
                  <Card
                    key={option.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? 'ring-2 ring-blue-500 border-blue-200 bg-blue-50/40' : ''
                    }`}
                    onClick={() =>
                      setFormState((prev) => ({
                        ...prev,
                        expectedVolume: option.id
                      }))
                    }
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{option.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                          <p className="text-xs text-blue-600 mt-2 font-medium uppercase tracking-wide">
                            {option.recommendation}
                          </p>
                        </div>
                        {isSelected && <CheckIcon className="h-5 w-5 text-blue-600" />}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900">How do you want to get started?</h2>
              <p className="text-sm text-gray-600 mt-2">
                Choose the setup approach that matches your timeline and level of customisation.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {SETUP_OPTIONS.map((option) => {
                const Icon = option.icon
                const isSelected = formState.setupOption === option.id

                return (
                  <Card
                    key={option.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? 'ring-2 ring-blue-500 border-blue-200 bg-blue-50/40' : ''
                    }`}
                    onClick={() => handleSetupOptionSelect(option.id)}
                  >
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-blue-100 p-2">
                          <Icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="font-medium text-gray-900">{option.name}</h3>
                            {isSelected && <CheckIcon className="h-5 w-5 text-blue-600" />}
                          </div>
                          <p className="text-sm text-gray-600">{option.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Estimated time</span>
                        <span className="font-medium text-gray-700">{option.duration}</span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {formState.setupOption === 'template' && (
              <Card className="border-blue-200 bg-blue-50/30">
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-sm font-semibold text-gray-900">
                      Recommended templates
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-600">
                      Hand-picked based on your industry and goal. Preview or pick one to continue.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenTemplateLibrary?.()}
                  >
                    Browse all templates
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-3">
                    {recommendedTemplates.slice(0, 3).map((template) => {
                      const isActive = selectedTemplate?.id === template.id

                      return (
                        <Card
                          key={template.id}
                          className={`border ${isActive ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-200'}`}
                        >
                          <CardHeader className="space-y-2">
                            <Badge variant="outline" className="w-fit text-xs capitalize">
                              {template.category}
                            </Badge>
                            <CardTitle className="text-base text-gray-900">
                              {template.name}
                            </CardTitle>
                            <CardDescription className="text-xs text-gray-600">
                              {template.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <QrCodeIcon className="h-4 w-4" />
                              <span>{template.estimatedTime}</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {template.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-[10px] capitalize">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                className="flex-1"
                                variant={isActive ? 'default' : 'secondary'}
                                onClick={() => onSelectTemplate(template)}
                              >
                                {isActive ? 'Selected' : 'Use template'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setPreviewTemplate(template)}
                              >
                                Preview
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                  {!selectedTemplate && (
                    <p className="text-xs text-gray-600">
                      Choose a template above or open the library to continue.
                    </p>
                  )}
                  {selectedTemplate && (
                    <div className="rounded-md border border-blue-100 bg-white p-3 text-xs text-blue-700">
                      <span className="font-medium text-blue-800">Selected:</span>{' '}
                      {selectedTemplate.name}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-gray-900">
                  Launch summary
                </CardTitle>
                <CardDescription className="text-xs text-gray-600">
                  We&apos;ll create your workspace with the following settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm text-gray-700 md:grid-cols-2">
                <div>
                  <span className="font-medium text-gray-900">Project name:</span>{' '}
                  {formState.projectName || '—'}
                </div>
                <div>
                  <span className="font-medium text-gray-900">Business type:</span>{' '}
                  {formState.businessType ? BUSINESS_TYPES.find(b => b.id === formState.businessType)?.name : '—'}
                </div>
                <div>
                  <span className="font-medium text-gray-900">Goal:</span>{' '}
                  {formState.primaryUseCase
                    ? USE_CASES.find(u => u.id === formState.primaryUseCase)?.name
                    : '—'}
                </div>
                <div>
                  <span className="font-medium text-gray-900">Setup:</span>{' '}
                  {formState.setupOption
                    ? SETUP_OPTIONS.find(o => o.id === formState.setupOption)?.name
                    : '—'}
                </div>
                {formState.setupOption === 'template' && (
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-900">Template:</span>{' '}
                    {selectedTemplate ? selectedTemplate.name : 'Not selected'}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Let&apos;s get you collecting feedback</h1>
              <p className="text-sm text-gray-600 mt-2">
                A three-step setup to launch your first project. You can always change these choices later.
              </p>
            </div>
            {onSkip && (
              <Button variant="ghost" onClick={onSkip}>
                Skip for now
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.2em] text-gray-500">
              <span>{steps[currentStep]}</span>
              <span>
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {renderStepContent()}

        <div className="flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={goBack}
            disabled={currentStep === 0 || isSubmitting}
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            {currentStep === steps.length - 1 && (
              <Button
                variant="outline"
                onClick={() => setPreviewTemplate(selectedTemplate)}
                disabled={!selectedTemplate || formState.setupOption !== 'template' || isSubmitting}
              >
                Preview selected
              </Button>
            )}
            <Button
              onClick={goNext}
              disabled={!canProceed() || isSubmitting}
            >
              {isSubmitting
                ? 'Creating...'
                : currentStep === steps.length - 1
                  ? 'Launch workspace'
                  : 'Continue'}
            </Button>
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
