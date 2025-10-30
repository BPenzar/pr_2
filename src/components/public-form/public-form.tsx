'use client'

import { useState, useEffect, useMemo } from 'react'
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

  const questions = useMemo(() => {
    const rawQuestions = (formData?.form as any)?.questions
    return Array.isArray(rawQuestions) ? rawQuestions : []
  }, [formData?.form])

  const isMultiStep = questions.length > 3
  const questionsPerStep = isMultiStep ? 1 : Math.max(questions.length, 1)
  const totalSteps = isMultiStep ? questions.length : 1
  const currentQuestions = isMultiStep
    ? questions.slice(currentStep, currentStep + questionsPerStep)
    : questions
  const isLastStep = currentStep >= totalSteps - 1

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

  useEffect(() => {
    setSubmitError(null)
  }, [currentStep])

  const handleResponseChange = (questionId: string, value: string | string[]) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }))
  }

  const stepValid = useMemo(() => {
    if (currentQuestions.length === 0) return true
    return currentQuestions.every((question: any) => {
      if (!question.required) return true

      const response = responses[question.id]
      if (question.type === 'multiselect') {
        return Array.isArray(response) && response.length > 0
      }
      return response && response.toString().trim() !== ''
    })
  }, [currentQuestions, responses])

  const handleNext = () => {
    if (!stepValid) {
      setSubmitError('Please answer the required question before continuing.')
      return
    }
    setSubmitError(null)
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBack = () => {
    if (currentStep === 0) return
    setSubmitError(null)
    setCurrentStep((prev) => Math.max(prev - 1, 0))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setSubmitError(null)

    if (!formData) return
    if (!stepValid) {
      setSubmitError('Please answer the required question before submitting.')
      return
    }

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
      if (error.type === 'RATE_LIMIT_EXCEEDED') {
        setSubmitError('Too many submissions. Please wait a few minutes and try again.')
      } else if (error.type === 'SPAM_DETECTED') {
        setSubmitError('Submission failed validation. Please try again.')
      } else if (error.type === 'CAPTCHA_FAILED') {
        setSubmitError('Verification failed. Please try again.')
        setCaptcha(generateSimpleCaptcha())
        setCaptchaInput('')
      } else if (error.type === 'LIMIT_EXCEEDED') {
        setSubmitError('This form has reached its response limit.')
      } else {
        if (!showCaptcha && (error.message?.toLowerCase().includes('validation') || error.message?.toLowerCase().includes('failed'))) {
          setShowCaptcha(true)
          setCaptcha(generateSimpleCaptcha())
        }
        setSubmitError(error.message ?? 'Something went wrong. Please try again.')
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    )
  }

  if (error || !formData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent className="p-6 text-center space-y-3">
            <AlertCircleIcon className="w-14 h-14 mx-auto text-red-400" />
            <h2 className="text-lg font-semibold">Form Not Available</h2>
            <p className="text-gray-600">
              {error?.message || 'This form could not be found or is no longer active.'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-white to-gray-100 p-4">
        <Card className="max-w-md w-full shadow-lg rounded-3xl border-none">
          <CardContent className="p-8 text-center space-y-3">
            <CheckCircleIcon className="w-16 h-16 mx-auto text-green-500" />
            <h2 className="text-xl font-semibold">Thank you!</h2>
            <p className="text-gray-600">Your feedback has been submitted successfully.</p>
            {formData.locationName && (
              <p className="text-sm text-gray-500">
                Location: {formData.locationName}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const progress = isMultiStep ? ((currentStep + 1) / totalSteps) * 100 : stepValid ? 100 : 0
  const isSubmittingResponse = submitResponse.isPending
  const formName = (formData.form as any).name
  const formDescription = (formData.form as any).description

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-white to-gray-100 pb-32 sm:pb-16">
      <div className="mx-auto w-full max-w-3xl px-4 pt-10">
        <Card className="border-none shadow-xl rounded-3xl bg-white/95 backdrop-blur">
          <CardHeader className="space-y-4 text-center px-6 pt-8 pb-0 sm:px-12">
            <div className="space-y-2">
              <CardTitle className="text-2xl font-semibold text-gray-900 sm:text-3xl">
                {formName}
              </CardTitle>
              {formDescription && (
                <CardDescription className="text-base text-gray-600">
                  {formDescription}
                </CardDescription>
              )}
              {formData.locationName && (
                <p className="text-sm font-medium text-gray-500">Location: {formData.locationName}</p>
              )}
            </div>

            {isMultiStep && (
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-gray-500">
                  <span>Step {currentStep + 1} of {totalSteps}</span>
                  <span>{Math.round(progress)}% complete</span>
                </div>
                <Progress value={progress} className="h-2 rounded-full" />
              </div>
            )}
          </CardHeader>

          <CardContent className="px-6 pb-8 sm:px-12 sm:pb-12">
            <form onSubmit={handleSubmit} className="space-y-6 pb-16">
              {submitError && (
                <Alert variant="destructive">
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}

              {currentQuestions.map((question: any) => (
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

              {showCaptcha && captcha && (
                <div className="p-4 border rounded-2xl bg-yellow-50 space-y-3">
                  <Label htmlFor="captcha" className="text-sm font-medium text-gray-800">
                    Security Check
                  </Label>
                  <p className="text-sm text-gray-600">{captcha.question}</p>
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

              <button type="submit" className="hidden" aria-hidden="true" />
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white/95 backdrop-blur px-4 py-4 sm:static sm:border-none sm:bg-transparent sm:px-0 sm:py-8">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {isMultiStep ? (
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0 || isSubmittingResponse}
                className="h-12 w-full sm:w-40"
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={isLastStep ? handleSubmit : handleNext}
                disabled={!stepValid || isSubmittingResponse}
                className="h-12 w-full sm:flex-1 text-base"
              >
                {isSubmittingResponse ? 'Sending…' : isLastStep ? 'Submit feedback' : 'Next question'}
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!stepValid || isSubmittingResponse}
              className="h-12 w-full sm:w-64 text-base"
            >
              {isSubmittingResponse ? 'Sending…' : 'Submit feedback'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
