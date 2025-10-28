'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  CheckIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  SparklesIcon,
  QrCodeIcon,
  FileTextIcon,
  BarChart3Icon,
  Users2Icon,
  CoffeeIcon,
  ShoppingBagIcon,
  BuildingIcon,
  HeartIcon
} from 'lucide-react'

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => void
  onSkip?: () => void
}

export interface OnboardingData {
  businessType: string
  primaryUseCase: string
  expectedVolume: string
  setupOption: 'quick' | 'guided' | 'template'
  selectedTemplate?: string
}

const BUSINESS_TYPES = [
  {
    id: 'restaurant',
    name: 'Restaurant/Food Service',
    icon: CoffeeIcon,
    description: 'Collect customer feedback on food, service, and ambiance'
  },
  {
    id: 'retail',
    name: 'Retail/E-commerce',
    icon: ShoppingBagIcon,
    description: 'Get feedback on products, shopping experience, and service'
  },
  {
    id: 'corporate',
    name: 'Corporate/Office',
    icon: BuildingIcon,
    description: 'Employee satisfaction, event feedback, and internal surveys'
  },
  {
    id: 'healthcare',
    name: 'Healthcare/Wellness',
    icon: HeartIcon,
    description: 'Patient experience, appointment feedback, and service quality'
  },
  {
    id: 'other',
    name: 'Other',
    icon: Users2Icon,
    description: 'Custom feedback collection for your unique needs'
  }
]

const USE_CASES = [
  {
    id: 'customer_satisfaction',
    name: 'Customer Satisfaction',
    description: 'Measure overall customer happiness and service quality'
  },
  {
    id: 'product_feedback',
    name: 'Product Feedback',
    description: 'Collect opinions on specific products or services'
  },
  {
    id: 'event_feedback',
    name: 'Event Feedback',
    description: 'Get feedback from attendees after events or experiences'
  },
  {
    id: 'employee_engagement',
    name: 'Employee Engagement',
    description: 'Internal feedback and satisfaction surveys'
  },
  {
    id: 'market_research',
    name: 'Market Research',
    description: 'Gather insights for business decisions and improvements'
  }
]

const VOLUME_OPTIONS = [
  {
    id: 'low',
    name: 'Just getting started',
    description: 'Less than 100 responses per month',
    recommended: 'Free Plan'
  },
  {
    id: 'medium',
    name: 'Growing business',
    description: '100-1,000 responses per month',
    recommended: 'Pro Plan'
  },
  {
    id: 'high',
    name: 'High volume',
    description: '1,000+ responses per month',
    recommended: 'Pro/Enterprise Plan'
  }
]

const SETUP_OPTIONS = [
  {
    id: 'quick',
    name: 'Quick Setup',
    description: 'Create a basic feedback form in 2 minutes',
    icon: SparklesIcon,
    duration: '2 min'
  },
  {
    id: 'template',
    name: 'Use Template',
    description: 'Start with a pre-built form template',
    icon: FileTextIcon,
    duration: '5 min'
  },
  {
    id: 'guided',
    name: 'Guided Setup',
    description: 'Step-by-step walkthrough with best practices',
    icon: Users2Icon,
    duration: '10 min'
  }
]

export function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Partial<OnboardingData>>({})

  const steps = [
    'Business Type',
    'Primary Use Case',
    'Expected Volume',
    'Setup Preference',
    'Summary'
  ]

  const progress = ((currentStep + 1) / steps.length) * 100

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete(formData as OnboardingData)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return !!formData.businessType
      case 1:
        return !!formData.primaryUseCase
      case 2:
        return !!formData.expectedVolume
      case 3:
        return !!formData.setupOption
      default:
        return true
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">What type of business do you have?</h2>
              <p className="text-gray-600">
                This helps us suggest the best setup for your needs
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {BUSINESS_TYPES.map((type) => {
                const Icon = type.icon
                return (
                  <Card
                    key={type.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      formData.businessType === type.id
                        ? 'ring-2 ring-blue-500 border-blue-200'
                        : ''
                    }`}
                    onClick={() => setFormData({ ...formData, businessType: type.id })}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{type.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                        </div>
                        {formData.businessType === type.id && (
                          <CheckIcon className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )

      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">What&apos;s your primary use case?</h2>
              <p className="text-gray-600">
                Tell us what you want to achieve with feedback collection
              </p>
            </div>
            <div className="space-y-3">
              {USE_CASES.map((useCase) => (
                <Card
                  key={useCase.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    formData.primaryUseCase === useCase.id
                      ? 'ring-2 ring-blue-500 border-blue-200'
                      : ''
                  }`}
                  onClick={() => setFormData({ ...formData, primaryUseCase: useCase.id })}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{useCase.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{useCase.description}</p>
                      </div>
                      {formData.primaryUseCase === useCase.id && (
                        <CheckIcon className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Expected response volume?</h2>
              <p className="text-gray-600">
                This helps us recommend the right plan for you
              </p>
            </div>
            <div className="space-y-3">
              {VOLUME_OPTIONS.map((option) => (
                <Card
                  key={option.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    formData.expectedVolume === option.id
                      ? 'ring-2 ring-blue-500 border-blue-200'
                      : ''
                  }`}
                  onClick={() => setFormData({ ...formData, expectedVolume: option.id })}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">{option.name}</h3>
                          <Badge variant="outline">{option.recommended}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                      </div>
                      {formData.expectedVolume === option.id && (
                        <CheckIcon className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">How would you like to get started?</h2>
              <p className="text-gray-600">
                Choose the setup approach that works best for you
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {SETUP_OPTIONS.map((option) => {
                const Icon = option.icon
                return (
                  <Card
                    key={option.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      formData.setupOption === option.id
                        ? 'ring-2 ring-blue-500 border-blue-200'
                        : ''
                    }`}
                    onClick={() => setFormData({ ...formData, setupOption: option.id as any })}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="p-3 bg-blue-100 rounded-lg mx-auto w-fit mb-3">
                        <Icon className="h-6 w-6 text-blue-600" />
                      </div>
                      <h3 className="font-medium mb-2">{option.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{option.description}</p>
                      <Badge variant="secondary">{option.duration}</Badge>
                      {formData.setupOption === option.id && (
                        <div className="mt-3">
                          <CheckIcon className="h-5 w-5 text-blue-600 mx-auto" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )

      case 4:
        const businessType = BUSINESS_TYPES.find(t => t.id === formData.businessType)
        const useCase = USE_CASES.find(u => u.id === formData.primaryUseCase)
        const volume = VOLUME_OPTIONS.find(v => v.id === formData.expectedVolume)
        const setup = SETUP_OPTIONS.find(s => s.id === formData.setupOption)

        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Ready to get started!</h2>
              <p className="text-gray-600">
                Review your preferences and let&apos;s create your first feedback form
              </p>
            </div>

            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-medium text-gray-900">Business Type</h4>
                      <p className="text-sm text-gray-600">{businessType?.name}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Primary Use Case</h4>
                      <p className="text-sm text-gray-600">{useCase?.name}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Expected Volume</h4>
                      <p className="text-sm text-gray-600">{volume?.name}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Setup Preference</h4>
                      <p className="text-sm text-gray-600">{setup?.name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-3">
                  <SparklesIcon className="h-5 w-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium text-blue-900">
                      {setup?.id === 'quick' && 'Quick Setup Ready'}
                      {setup?.id === 'template' && 'Template Selected'}
                      {setup?.id === 'guided' && 'Guided Setup Ready'}
                    </h4>
                    <p className="text-sm text-blue-700">
                      {setup?.id === 'quick' && 'We\'ll create a basic feedback form for you in seconds'}
                      {setup?.id === 'template' && 'Choose from our curated templates on the next page'}
                      {setup?.id === 'guided' && 'Follow our step-by-step guide to create the perfect form'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to BSP Feedback Tool</CardTitle>
          <CardDescription>
            Let&apos;s set up your feedback collection system in just a few steps
          </CardDescription>
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="w-full" />
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              {steps.map((step, index) => (
                <span
                  key={step}
                  className={index <= currentStep ? 'text-blue-600 font-medium' : ''}
                >
                  {step}
                </span>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-6">
          <div className="min-h-[400px]">
            {renderStepContent()}
          </div>

          <div className="flex justify-between items-center pt-6 border-t">
            <div className="flex space-x-2">
              {currentStep > 0 && (
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
              {onSkip && currentStep === 0 && (
                <Button variant="ghost" onClick={onSkip}>
                  Skip setup
                </Button>
              )}
            </div>

            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  Get Started
                </>
              ) : (
                <>
                  Continue
                  <ArrowRightIcon className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}