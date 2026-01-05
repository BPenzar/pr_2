import { describe, expect, it } from 'vitest'
import {
  findOptionColor,
  normalizeChoiceOptions,
  normalizeQuestionOptions,
  sanitizeChoiceOptions,
} from '@/lib/question-utils'

describe('question option helpers', () => {
  it('normalizes mixed option input', () => {
    const raw = [
      'Apple | blue',
      ' ',
      { label: 'Banana', color: 'red' },
      { value: 'Cherry', color: 'purple' },
      42,
    ]

    expect(normalizeChoiceOptions(raw)).toEqual([
      { label: 'Apple', color: 'blue' },
      { label: 'Banana', color: 'red' },
      { label: 'Cherry' },
      { label: '42' },
    ])
  })

  it('normalizes question objects with options', () => {
    const question = normalizeQuestionOptions({
      id: 'q1',
      options: ['Option 1', 'Option 2 | green'],
    })

    expect(question.options).toEqual([
      { label: 'Option 1' },
      { label: 'Option 2', color: 'green' },
    ])
  })

  it('sanitizes and trims options', () => {
    const sanitized = sanitizeChoiceOptions([
      { label: '  Hello ', color: 'blue' },
      { label: '   ' },
    ])

    expect(sanitized).toEqual([{ label: 'Hello', color: 'blue' }])
  })

  it('finds option colors by label', () => {
    const color = findOptionColor(
      [
        { label: 'Yes', color: 'green' },
        { label: 'No', color: 'red' },
      ],
      'Yes'
    )

    expect(color).toBe('green')
  })
})
