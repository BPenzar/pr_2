'use client'

import { useState } from 'react'
import { QuestionRenderer } from './question-renderer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
}

export function FormPreview({ form }: FormPreviewProps) {
  const [responses, setResponses] = useState<Record<string, string | string[]>>({})
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitted, setIsSubmitted] = useState(false)

  if (!form.questions || form.questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <p>No questions have been added to this form yet.</p>
              <p className="text-sm mt-2">Add some questions in the form builder to see the preview.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const sortedQuestions = [...form.questions].sort((a, b) => a.order_index - b.order_index)
  const isMultiStep = sortedQuestions.length > 3
  const questionsPerStep = isMultiStep ? Math.ceil(sortedQuestions.length / Math.ceil(sortedQuestions.length / 3)) : sortedQuestions.length
  const totalSteps = isMultiStep ? Math.ceil(sortedQuestions.length / questionsPerStep) : 1

  const currentQuestions = isMultiStep
    ? sortedQuestions.slice(currentStep * questionsPerStep, (currentStep + 1) * questionsPerStep)
    : sortedQuestions

  const progress = isMultiStep ? ((currentStep + 1) / totalSteps) * 100 : 100

  const handleResponseChange = (questionId: string, value: string | string[]) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = () => {
    // In preview mode, just show success without actually submitting
    setIsSubmitted(true)
  }

  const canProceed = () => {
    return currentQuestions.every(question => {
      if (!question.required) return true
      const response = responses[question.id]
      if (Array.isArray(response)) {
        return response.length > 0
      }
      return response && response.trim() !== ''
    })
  }

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Preview Complete!</h2>
              <p className="text-gray-600 mb-4">
                This is how the success page will appear to users after they submit the form.
              </p>
              <Button onClick={() => setIsSubmitted(false)}>
                Reset Preview
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>{form.name}</CardTitle>
          {form.description && (
            <CardDescription>{form.description}</CardDescription>
          )}
          {isMultiStep && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Step {currentStep + 1} of {totalSteps}</span>
                <span>{Math.round(progress)}% complete</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {currentQuestions.map((question) => (
            <QuestionRenderer
              key={question.id}
              question={question}
              value={responses[question.id] || ''}
              onChange={(value) => handleResponseChange(question.id, value)}
            />
          ))}

          <div className="flex justify-between pt-4">
            <div>
              {isMultiStep && currentStep > 0 && (
                <Button variant="outline" onClick={handlePrevious}>
                  Previous
                </Button>
              )}
            </div>
            <div>
              {isMultiStep && currentStep < totalSteps - 1 ? (
                <Button onClick={handleNext} disabled={!canProceed()}>
                  Next
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={!canProceed()}>
                  Submit (Preview)
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
