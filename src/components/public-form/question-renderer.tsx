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
      autoComplete="off"
      className="w-full h-12 text-base"
    />
  )

  const renderTextareaInput = () => (
    <Textarea
      placeholder="Enter your detailed answer..."
      value={value as string}
      onChange={(e) => onChange(e.target.value)}
      required={question.required}
      rows={4}
      className="w-full text-base"
    />
  )

  const renderRatingInput = () => {
    const currentRating = parseInt(value as string) || 0
    const maxRating = question.rating_scale ?? 10
    const isStarRating = maxRating === 5
    const ratingValues = Array.from({ length: maxRating }, (_, i) => i + 1)

    if (isStarRating) {
      // 5-star rating with star icons
      return (
        <div className="flex items-center space-x-2">
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
                  className={`w-9 h-9 transition-colors ${
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
      const getBaseColor = (ratingValue: number) => {
        if (ratingValue <= 6) return 'border-red-200 bg-red-50 text-red-700'
        if (ratingValue <= 8) return 'border-yellow-200 bg-yellow-50 text-yellow-700'
        if (ratingValue === 9) return 'border-green-200 bg-green-50 text-green-700'
        return 'border-green-300 bg-green-100 text-green-800'
      }

      const getHoverColor = (ratingValue: number) => {
        if (ratingValue <= 6) return 'border-red-400 bg-red-100 text-red-800'
        if (ratingValue <= 8) return 'border-yellow-400 bg-yellow-100 text-yellow-800'
        if (ratingValue === 9) return 'border-green-400 bg-green-100 text-green-800'
        return 'border-green-500 bg-green-200 text-green-900'
      }

      const getSelectedColor = (ratingValue: number) => {
        if (ratingValue <= 6) return 'border-red-600 bg-red-600 text-white shadow-sm'
        if (ratingValue <= 8) return 'border-yellow-500 bg-yellow-500 text-white shadow-sm'
        if (ratingValue === 9) return 'border-green-500 bg-green-500 text-white shadow-sm'
        return 'border-green-700 bg-green-700 text-white shadow-sm'
      }

      return (
        <div className="space-y-3">
          <div className="grid grid-cols-5 gap-2 sm:flex sm:flex-wrap sm:gap-2 sm:justify-center">
            {ratingValues.map((ratingValue) => {
              const isSelected = ratingValue === currentRating
              const isHovered = ratingValue === hoverRating
              const baseColor = getBaseColor(ratingValue)

              return (
                <button
                  key={ratingValue}
                  type="button"
                  onClick={() => onChange(ratingValue.toString())}
                  onMouseEnter={() => setHoverRating(ratingValue)}
                  onMouseLeave={() => setHoverRating(null)}
                  className={`flex h-12 w-full min-w-[2.75rem] items-center justify-center rounded-xl border-2 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 sm:h-12 sm:w-12 md:h-14 md:w-14 ${
                    isSelected
                      ? getSelectedColor(ratingValue)
                      : isHovered
                      ? getHoverColor(ratingValue)
                      : baseColor
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
        {question.options.map((option, index) => {
          const isSelected = value === option
          return (
            <label
              key={index}
              className={`flex items-center gap-3 rounded-2xl border p-4 shadow-sm transition focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 ${
                isSelected ? 'border-primary/80 bg-primary/5' : 'border-gray-200 bg-white'
              }`}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={option}
                checked={isSelected}
                onChange={(e) => onChange(e.target.value)}
                required={question.required}
                className="h-5 w-5 border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-base text-gray-800">{option}</span>
            </label>
          )
        })}
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
        {question.options.map((option, index) => {
          const isChecked = selectedValues.includes(option)
          return (
            <label
              key={index}
              className={`flex items-center gap-3 rounded-2xl border p-4 shadow-sm transition focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 ${
                isChecked ? 'border-primary/80 bg-primary/5' : 'border-gray-200 bg-white'
              }`}
            >
              <Checkbox
                checked={isChecked}
                onCheckedChange={(checked) => handleCheckboxChange(option, checked as boolean)}
                className="h-5 w-5 border-gray-300 text-primary"
              />
              <span className="text-base text-gray-800">{option}</span>
            </label>
          )
        })}
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
