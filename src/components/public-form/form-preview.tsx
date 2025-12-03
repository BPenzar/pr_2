'use client'

import { useEffect, useMemo, useState } from 'react'
import { QuestionRenderer } from './question-renderer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { CheckCircleIcon } from 'lucide-react'
import { Question } from '@/types/database'

interface FormPreviewProps {
  form: {
    id: string
    name: string
    description?: string
    questions: Question[]
  }
  stacked?: boolean
}

const scrollToTop = () => {
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

export function FormPreview({ form, stacked = false }: FormPreviewProps) {
  const sortedQuestions = useMemo(
    () => [...(form.questions ?? [])].sort((a, b) => a.order_index - b.order_index),
    [form.questions]
  )

  const [responses, setResponses] = useState<Record<string, string | string[]>>({})
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    const initial: Record<string, string | string[]> = {}

    sortedQuestions.forEach((question) => {
      initial[question.id] = question.type === 'multiselect' ? [] : ''
    })

    setResponses(initial)
    setCurrentStep(0)
    setIsSubmitted(false)
    setSubmitError(null)
  }, [sortedQuestions])

  const isMultiStep = sortedQuestions.length > 3
  const questionsPerStep = isMultiStep ? 1 : Math.max(sortedQuestions.length, 1)
  const totalSteps = isMultiStep ? sortedQuestions.length : 1
  const isLastStep = currentStep >= totalSteps - 1
  const isSubmittingResponse = false

  const currentQuestions = useMemo(() => {
    return isMultiStep
      ? sortedQuestions.slice(currentStep, currentStep + questionsPerStep)
      : sortedQuestions
  }, [currentStep, isMultiStep, questionsPerStep, sortedQuestions])

  const stepValid = useMemo(() => {
    if (currentQuestions.length === 0) return true

    return currentQuestions.every((question) => {
      if (!question.required) return true

      const response = responses[question.id]
      if (question.type === 'multiselect') {
        return Array.isArray(response) && response.length > 0
      }
      return response !== undefined && response.toString().trim() !== ''
    })
  }, [currentQuestions, responses])

  const progress = isMultiStep ? ((currentStep + 1) / totalSteps) * 100 : stepValid ? 100 : 0
  const maxWidthClass = stacked ? 'max-w-[390px]' : 'max-w-3xl'

  const handleResponseChange = (questionId: string, value: string | string[]) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }))
  }

  const handleNext = () => {
    if (!stepValid) {
      setSubmitError('Please answer the required question before continuing.')
      return
    }
    setSubmitError(null)
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1))
    scrollToTop()
  }

  const handleBack = () => {
    setSubmitError(null)
    setCurrentStep((prev) => Math.max(prev - 1, 0))
    scrollToTop()
  }

  const handleSubmit = (event?: React.FormEvent) => {
    event?.preventDefault()
    if (!stepValid) {
      setSubmitError('Please answer the required question before submitting.')
      return
    }
    setSubmitError(null)
    setIsSubmitted(true)
  }

  if (sortedQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-white to-gray-100 flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-none shadow-xl rounded-3xl bg-white/95 backdrop-blur">
          <CardContent className="p-8 text-center space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">No questions yet</h2>
            <p className="text-gray-600">
              Add some questions in the form builder to see how the live form will look.
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
            <p className="text-gray-600">
              This success screen matches what respondents will see after submitting the form.
            </p>
            <Button onClick={() => setIsSubmitted(false)}>Reset Preview</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-white to-gray-100 pb-32 sm:pb-16">
      <div className={`mx-auto w-full ${maxWidthClass} px-4 pt-10`}>
      <Card className="border-none shadow-xl rounded-3xl bg-white/95 backdrop-blur">
        <CardHeader className="space-y-5 text-center px-6 pt-10 pb-2 sm:px-12 sm:pt-12">
          <CardTitle className="text-2xl font-semibold text-gray-900 sm:text-3xl">
            {form.name}
          </CardTitle>
          {form.description && (
            <CardDescription className="text-base text-gray-600">
                {form.description}
              </CardDescription>
            )}
            {isMultiStep && (
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-gray-500">
                  <span>
                    Step {currentStep + 1} of {totalSteps}
                  </span>
                  <span>{Math.round(progress)}% complete</span>
                </div>
                <Progress value={progress} className="h-2 rounded-full" />
              </div>
            )}
          </CardHeader>

        <CardContent className="px-6 pb-8 pt-10 sm:px-12 sm:pb-12 sm:pt-14">
          <form onSubmit={handleSubmit} className="space-y-6 pb-16">
            {submitError && (
              <Alert variant="destructive">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-6 pt-4 sm:pt-6">
              {currentQuestions.map((question) => (
                <QuestionRenderer
                    key={question.id}
                    question={question}
                    value={
                      responses[question.id] ||
                      (question.type === 'multiselect' ? [] : '')
                    }
                    onChange={(value) => handleResponseChange(question.id, value)}
                  />
                ))}
              </div>

              <button type="submit" className="hidden" aria-hidden="true" />
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white/95 backdrop-blur px-4 py-4 sm:static sm:border-none sm:bg-transparent sm:px-0 sm:py-8">
        <div
          className={`mx-auto flex w-full ${maxWidthClass} flex-col gap-3 sm:flex-row sm:items-center ${isMultiStep ? 'sm:justify-between' : 'sm:justify-center'}`}
        >
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
                onClick={isLastStep ? () => handleSubmit() : handleNext}
                disabled={!stepValid || isSubmittingResponse}
                className="h-12 w-full sm:flex-1 text-base"
              >
                {isSubmittingResponse
                  ? 'Sending…'
                  : isLastStep
                  ? 'Submit feedback'
                  : 'Next question'}
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              onClick={() => handleSubmit()}
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
