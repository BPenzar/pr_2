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
    const maxRating = question.rating_scale || 5
    const isStarRating = maxRating === 5

    if (isStarRating) {
      // 5-star rating with star icons
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
    } else {
      // 1-10 scale with numbered buttons
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-5 gap-2">
            {[...Array(maxRating)].map((_, index) => {
              const ratingValue = index + 1
              const isSelected = ratingValue === currentRating
              const isHovered = ratingValue === hoverRating

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => onChange(ratingValue.toString())}
                  onMouseEnter={() => setHoverRating(ratingValue)}
                  onMouseLeave={() => setHoverRating(null)}
                  className={`w-12 h-12 rounded-lg border-2 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600'
                      : isHovered
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {ratingValue}
                </button>
              )
            })}
          </div>
          {currentRating > 0 && (
            <div className="text-center text-sm text-gray-600">
              Selected: {currentRating} out of {maxRating}
            </div>
          )}
        </div>
      )
    }
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