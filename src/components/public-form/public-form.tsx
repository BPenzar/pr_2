'use client'

import { useState, useEffect } from 'react'
import { usePublicForm, useSubmitResponse } from '@/hooks/use-public-form'
import { QuestionRenderer } from './question-renderer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircleIcon, AlertCircleIcon } from 'lucide-react'
import { createFormLoadToken, generateSimpleCaptcha } from '@/lib/anti-spam'

interface PublicFormProps {
  shortUrl: string
}

export function PublicForm({ shortUrl }: PublicFormProps) {
  const { data: formData, isLoading, error } = usePublicForm(shortUrl)
  const submitResponse = useSubmitResponse()

  const [responses, setResponses] = useState<Record<string, string | string[]>>({})
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Anti-spam measures
  const [honeypotValue, setHoneypotValue] = useState('')
  const [formLoadToken] = useState(() => createFormLoadToken())
  const [showCaptcha, setShowCaptcha] = useState(false)
  const [captcha, setCaptcha] = useState<{ question: string; answer: string } | null>(null)
  const [captchaInput, setCaptchaInput] = useState('')

  const questions = (formData?.form as any)?.questions || []
  const isMultiStep = questions.length > 3
  const questionsPerStep = isMultiStep ? 1 : questions.length
  const totalSteps = isMultiStep ? questions.length : 1
  const currentQuestions = isMultiStep
    ? questions.slice(currentStep, currentStep + 1)
    : questions

  // Initialize responses
  useEffect(() => {
    if (questions.length > 0) {
      const initialResponses: Record<string, string | string[]> = {}
      questions.forEach((question: any) => {
        if (question.type === 'multiselect') {
          initialResponses[question.id] = []
        } else {
          initialResponses[question.id] = ''
        }
      })
      setResponses(initialResponses)
    }
  }, [questions])

  const handleResponseChange = (questionId: string, value: string | string[]) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value,
    }))
  }

  const validateCurrentStep = () => {
    return currentQuestions.every((question: any) => {
      if (!question.required) return true

      const response = responses[question.id]
      if (question.type === 'multiselect') {
        return Array.isArray(response) && response.length > 0
      }
      return response && response.toString().trim() !== ''
    })
  }

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setSubmitError(null)

    if (!formData) return

    // If CAPTCHA is required, validate it first
    if (showCaptcha && captcha) {
      if (!captchaInput.trim()) {
        setSubmitError('Please complete the verification challenge')
        return
      }
    }

    try {
      await submitResponse.mutateAsync({
        formId: (formData.form as any).id,
        qrCodeId: formData.qrCodeId,
        locationName: formData.locationName,
        responses,
        honeypotValue,
        formLoadToken,
        captchaQuestion: captcha?.question,
        captchaAnswer: captchaInput,
      })
      setIsSubmitted(true)
    } catch (error: any) {
      // Handle specific error types
      if (error.type === 'RATE_LIMIT_EXCEEDED') {
        setSubmitError('Too many submissions. Please wait a few minutes and try again.')
      } else if (error.type === 'SPAM_DETECTED') {
        setSubmitError('Submission failed validation. Please try again.')
      } else if (error.type === 'CAPTCHA_FAILED') {
        setSubmitError('Verification failed. Please try again.')
        // Reset CAPTCHA
        setCaptcha(generateSimpleCaptcha())
        setCaptchaInput('')
      } else if (error.type === 'LIMIT_EXCEEDED') {
        setSubmitError('This form has reached its response limit.')
      } else {
        // For certain errors, show CAPTCHA on retry
        if (!showCaptcha && (error.message.includes('validation') || error.message.includes('failed'))) {
          setShowCaptcha(true)
          setCaptcha(generateSimpleCaptcha())
        }
        setSubmitError(error.message)
      }
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !formData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertCircleIcon className="w-16 h-16 mx-auto text-red-400 mb-4" />
            <h2 className="text-lg font-semibold mb-2">Form Not Available</h2>
            <p className="text-gray-600">
              {error?.message || 'This form could not be found or is no longer active.'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state
  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <CheckCircleIcon className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h2 className="text-lg font-semibold mb-2">Thank You!</h2>
            <p className="text-gray-600">
              Your feedback has been submitted successfully.
            </p>
            {formData.locationName && (
              <p className="text-sm text-gray-500 mt-2">
                Location: {formData.locationName}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const progress = isMultiStep ? ((currentStep + 1) / totalSteps) * 100 : 100

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="text-center">
              <CardTitle className="text-xl">{(formData.form as any).name}</CardTitle>
              {(formData.form as any).description && (
                <CardDescription className="mt-2">
                  {(formData.form as any).description}
                </CardDescription>
              )}
              {formData.locationName && (
                <p className="text-sm text-gray-500 mt-1">
                  Location: {formData.locationName}
                </p>
              )}
            </div>

            {isMultiStep && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Step {currentStep + 1} of {totalSteps}</span>
                  <span>{Math.round(progress)}% complete</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {submitError && (
                <Alert variant="destructive">
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}

              {currentQuestions.map((question: any, index: number) => (
                <QuestionRenderer
                  key={question.id}
                  question={question}
                  value={responses[question.id] || (question.type === 'multiselect' ? [] : '')}
                  onChange={(value) => handleResponseChange(question.id, value)}
                />
              ))}

              {/* Honeypot field - hidden from users but visible to bots */}
              <div style={{ display: 'none' }}>
                <Label htmlFor="email_confirm">Please leave this field empty</Label>
                <Input
                  id="email_confirm"
                  name="email_confirm"
                  type="text"
                  value={honeypotValue}
                  onChange={(e) => setHoneypotValue(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              {/* CAPTCHA challenge when needed */}
              {showCaptcha && captcha && (
                <div className="p-4 border rounded-lg bg-yellow-50">
                  <Label htmlFor="captcha" className="block text-sm font-medium mb-2">
                    Security Check
                  </Label>
                  <p className="text-sm text-gray-600 mb-3">
                    {captcha.question}
                  </p>
                  <Input
                    id="captcha"
                    type="text"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    placeholder="Your answer"
                    required
                  />
                </div>
              )}

              <div className="flex justify-between pt-6">
                {isMultiStep && currentStep > 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                ) : (
                  <div></div>
                )}

                {isMultiStep && currentStep < totalSteps - 1 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!validateCurrentStep()}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={submitResponse.isPending || !validateCurrentStep()}
                  >
                    {submitResponse.isPending ? 'Submitting...' : 'Submit Feedback'}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}