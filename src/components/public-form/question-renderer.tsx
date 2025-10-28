'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Question } from '@/types/database'
import { StarIcon } from 'lucide-react'

interface QuestionRendererProps {
  question: Question
  value: string | string[]
  onChange: (value: string | string[]) => void
}

export function QuestionRenderer({ question, value, onChange }: QuestionRendererProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null)

  const renderTextInput = () => (
    <Input
      type="text"
      placeholder="Enter your answer..."
      value={value as string}
      onChange={(e) => onChange(e.target.value)}
      required={question.required}
      className="w-full"
    />
  )

  const renderTextareaInput = () => (
    <Textarea
      placeholder="Enter your detailed answer..."
      value={value as string}
      onChange={(e) => onChange(e.target.value)}
      required={question.required}
      rows={4}
      className="w-full"
    />
  )

  const renderRatingInput = () => {
    const currentRating = parseInt(value as string) || 0
    const maxRating = 5 // Default to 5-star rating

    return (
      <div className="flex items-center space-x-1">
        {[...Array(maxRating)].map((_, index) => {
          const starValue = index + 1
          const isFilled = starValue <= (hoverRating || currentRating)

          return (
            <button
              key={index}
              type="button"
              onClick={() => onChange(starValue.toString())}
              onMouseEnter={() => setHoverRating(starValue)}
              onMouseLeave={() => setHoverRating(null)}
              className="focus:outline-none"
            >
              <StarIcon
                className={`w-8 h-8 transition-colors ${
                  isFilled
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300 hover:text-yellow-400'
                }`}
              />
            </button>
          )
        })}
        {currentRating > 0 && (
          <span className="ml-2 text-sm text-gray-600">
            {currentRating} out of {maxRating}
          </span>
        )}
      </div>
    )
  }

  const renderChoiceInput = () => {
    if (!question.options) return null

    return (
      <div className="space-y-3">
        {question.options.map((option, index) => (
          <label key={index} className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              name={`question-${question.id}`}
              value={option}
              checked={value === option}
              onChange={(e) => onChange(e.target.value)}
              required={question.required}
              className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
            />
            <span className="text-sm">{option}</span>
          </label>
        ))}
      </div>
    )
  }

  const renderMultiselectInput = () => {
    if (!question.options) return null
    const selectedValues = Array.isArray(value) ? value : []

    const handleCheckboxChange = (option: string, checked: boolean) => {
      if (checked) {
        onChange([...selectedValues, option])
      } else {
        onChange(selectedValues.filter(v => v !== option))
      }
    }

    return (
      <div className="space-y-3">
        {question.options.map((option, index) => (
          <label key={index} className="flex items-center space-x-3 cursor-pointer">
            <Checkbox
              checked={selectedValues.includes(option)}
              onCheckedChange={(checked) => handleCheckboxChange(option, checked as boolean)}
            />
            <span className="text-sm">{option}</span>
          </label>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-base font-medium">
          {question.title}
          {question.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {question.description && (
          <p className="text-sm text-gray-600 mt-1">{question.description}</p>
        )}
      </div>

      <div>
        {question.type === 'text' && renderTextInput()}
        {question.type === 'textarea' && renderTextareaInput()}
        {question.type === 'rating' && renderRatingInput()}
        {question.type === 'choice' && renderChoiceInput()}
        {question.type === 'multiselect' && renderMultiselectInput()}
      </div>
    </div>
  )
}