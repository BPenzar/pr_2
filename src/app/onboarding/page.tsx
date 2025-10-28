'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingWizard, type OnboardingData } from '@/components/onboarding/onboarding-wizard'
import { TemplateSelector } from '@/components/onboarding/template-selector'
import { useCompleteOnboarding } from '@/hooks/use-templates'
import { getTemplateById, type FormTemplate } from '@/lib/form-templates'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckIcon, SparklesIcon, ArrowRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

type OnboardingStep = 'wizard' | 'template' | 'complete'

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('wizard')
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null)

  const completeOnboarding = useCompleteOnboarding()

  const handleWizardComplete = (data: OnboardingData) => {
    setOnboardingData(data)

    if (data.setupOption === 'template') {
      setCurrentStep('template')
    } else {
      handleFinishOnboarding(data)
    }
  }

  const handleTemplateSelected = (template: FormTemplate) => {
    setSelectedTemplate(template)
    if (onboardingData) {
      const updatedData = { ...onboardingData, selectedTemplate: template.id }
      handleFinishOnboarding(updatedData, template)
    }
  }

  const handleFinishOnboarding = async (data: OnboardingData, template?: FormTemplate) => {
    try {
      // Generate project name based on business type
      const businessTypeNames = {
        restaurant: 'Restaurant Feedback',
        retail: 'Store Feedback',
        corporate: 'Company Feedback',
        healthcare: 'Patient Feedback',
        other: 'Customer Feedback'
      }

      const projectName = businessTypeNames[data.businessType as keyof typeof businessTypeNames] || 'My Feedback Project'

      const result = await completeOnboarding.mutateAsync({
        projectName,
        projectDescription: `Feedback collection for ${data.businessType} business`,
        template: template || (data.selectedTemplate ? getTemplateById(data.selectedTemplate) : undefined),
        setupOption: data.setupOption,
        businessType: data.businessType
      })

      setCurrentStep('complete')

      // Redirect after showing success
      setTimeout(() => {
        if (result.form) {
          router.push(`/forms/${result.form.id}`)
        } else {
          router.push(`/projects/${result.project.id}`)
        }
      }, 2000)

    } catch (error) {
      console.error('Onboarding failed:', error)
      // Handle error - could show an error message
    }
  }

  const handleSkipOnboarding = () => {
    router.push('/dashboard')
  }

  const handleBackToWizard = () => {
    setCurrentStep('wizard')
  }

  if (currentStep === 'complete') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="p-3 bg-green-100 rounded-full mx-auto w-fit mb-4">
              <CheckIcon className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">You&apos;re all set!</h2>
            <p className="text-gray-600 mb-4">
              Your project and form have been created successfully.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>✅ Project created</p>
              {onboardingData?.setupOption !== 'guided' && <p>✅ Form created</p>}
              <p>✅ Ready to collect feedback</p>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Redirecting you to your {onboardingData?.setupOption === 'guided' ? 'project' : 'form'}...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentStep === 'template') {
    return (
      <TemplateSelector
        businessType={onboardingData?.businessType}
        useCase={onboardingData?.primaryUseCase}
        onSelectTemplate={handleTemplateSelected}
        onBack={handleBackToWizard}
        onSkip={() => {
          if (onboardingData) {
            handleFinishOnboarding({ ...onboardingData, setupOption: 'guided' })
          }
        }}
      />
    )
  }

  return (
    <OnboardingWizard
      onComplete={handleWizardComplete}
      onSkip={handleSkipOnboarding}
    />
  )
}