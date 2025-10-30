'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  OnboardingWizard,
  type OnboardingData,
  type OnboardingFormState
} from '@/components/onboarding/onboarding-wizard'
import { TemplateSelector } from '@/components/onboarding/template-selector'
import { useCompleteOnboarding } from '@/hooks/use-templates'
import { getTemplateById, type FormTemplate } from '@/lib/form-templates'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { markOnboardingCompleted } from '@/lib/onboarding'
import { useProjects } from '@/hooks/use-projects'

interface CompletionState {
  setupOption: OnboardingData['setupOption']
}

export default function OnboardingPage() {
  const router = useRouter()
  const completeOnboarding = useCompleteOnboarding()
  const { account } = useAuth()
  const { data: projects } = useProjects()

  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null)
  const [wizardState, setWizardState] = useState<OnboardingFormState | null>(null)
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [completionState, setCompletionState] = useState<CompletionState | null>(null)
  const projectCount = projects?.length ?? 0
  const shouldRedirect = projectCount > 0

  useEffect(() => {
    if (shouldRedirect) {
      router.replace('/dashboard')
    }
  }, [shouldRedirect, router])

  const handleWizardComplete = async (data: OnboardingData) => {
    try {
      setErrorMessage(null)

      const template =
        data.setupOption === 'template'
          ? getTemplateById(data.selectedTemplate ?? selectedTemplate?.id ?? '') ?? selectedTemplate ?? undefined
          : undefined

      const result = await completeOnboarding.mutateAsync({
        projectName: data.projectName,
        projectDescription: `Feedback collection for ${data.businessType} business`,
        template,
        setupOption: data.setupOption,
        businessType: data.businessType
      })

      if (account?.id) {
        await markOnboardingCompleted(account.id)
      }

      setCompletionState({
        setupOption: data.setupOption
      })

      setTimeout(() => {
        router.replace('/dashboard')
      }, 2000)
    } catch (error) {
      const serializedError =
        error && typeof error === 'object'
          ? {
              message: (error as { message?: string }).message ?? 'Unknown error',
              details: (error as { details?: string | null }).details ?? null,
              hint: (error as { hint?: string | null }).hint ?? null,
              code: (error as { code?: string | null }).code ?? null,
            }
          : { message: String(error ?? 'Unknown error'), details: null, hint: null, code: null }

      console.error('Onboarding failed:', serializedError)
      setErrorMessage(serializedError.message ?? 'Failed to complete onboarding. Please try again.')
    }
  }

  const handleSkipOnboarding = async () => {
    if (account?.id) {
      await markOnboardingCompleted(account.id)
    }
    router.replace('/dashboard')
  }

  if (shouldRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-sm text-muted-foreground">
        Redirecting you to your dashboard...
      </div>
    )
  }

  const handleTemplateSelected = (template: FormTemplate) => {
    setSelectedTemplate(template)
    setShowTemplateLibrary(false)
  }

  if (completionState) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="p-3 bg-green-100 rounded-full mx-auto w-fit mb-4">
              <CheckIcon className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">You&apos;re all set!</h2>
            <p className="text-gray-600 mb-4">
              Your workspace is ready. We&apos;re taking you to the dashboard.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>✅ Project created</p>
              {completionState.setupOption !== 'guided' && <p>✅ First form created</p>}
              <p>✅ Ready to collect feedback</p>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Redirecting you to your dashboard...
            </p>
            <Button variant="link" className="mt-4 text-xs" onClick={() => {
              router.replace('/dashboard')
            }}>
              Go now
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {errorMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}
        <OnboardingWizard
          onComplete={handleWizardComplete}
          onSkip={handleSkipOnboarding}
          onOpenTemplateLibrary={() => setShowTemplateLibrary(true)}
          selectedTemplate={selectedTemplate}
          onSelectTemplate={setSelectedTemplate}
          isSubmitting={completeOnboarding.isPending}
          onStateChange={setWizardState}
        />
      </div>

      {showTemplateLibrary && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
          <TemplateSelector
            businessType={wizardState?.businessType}
            useCase={wizardState?.primaryUseCase}
            onSelectTemplate={handleTemplateSelected}
            onBack={() => setShowTemplateLibrary(false)}
          />
        </div>
      )}
    </>
  )
}
