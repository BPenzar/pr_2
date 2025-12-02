import { OPTION_COLOR_CHOICES, OptionColorKey } from './option-colors'

export type ChoiceOption = {
  label: string
  color?: OptionColorKey
}

const COLOR_VALUES = OPTION_COLOR_CHOICES.map((entry) => entry.value).filter(
  (value): value is OptionColorKey => value !== 'none'
)

export function normalizeChoiceOptions(raw: any): ChoiceOption[] {
  if (!raw) return []

  if (Array.isArray(raw)) {
    return raw
      .map((entry) => {
        if (!entry) return null
        if (typeof entry === 'string') {
          const raw = entry.trim()
          if (!raw) return null

          // Support inline color flags using "Label | color"
          const pipeIndex = raw.lastIndexOf('|')
          if (pipeIndex !== -1) {
            const labelPart = raw.slice(0, pipeIndex).trim()
            const colorPart = raw.slice(pipeIndex + 1).trim().toLowerCase()
            const color = COLOR_VALUES.find((c) => c === colorPart)
            if (labelPart) {
              return color ? { label: labelPart, color } : { label: labelPart }
            }
          }

          return { label: raw }
        }
        if (typeof entry === 'object') {
          const label = (entry.label ?? entry.value ?? '').toString().trim()
          if (!label) return null
          const color =
            entry.color && COLOR_VALUES.includes(entry.color) ? (entry.color as OptionColorKey) : undefined
          return { label, color }
        }
        const label = String(entry).trim()
        return label ? { label } : null
      })
      .filter((option): option is ChoiceOption => Boolean(option))
  }

  if (typeof raw === 'object') {
    try {
      const parsed = JSON.parse(JSON.stringify(raw))
      return normalizeChoiceOptions(parsed)
    } catch {
      return []
    }
  }

  return []
}

export function normalizeQuestionOptions<T extends { options?: any }>(question: T): T & {
  options?: ChoiceOption[]
} {
  if (!question) return question
  return {
    ...question,
    options: normalizeChoiceOptions(question.options),
  }
}

export function sanitizeChoiceOptions(options: ChoiceOption[]): ChoiceOption[] {
  return options
    .map(({ label, color }) => {
      const trimmed = label.trim()
      if (!trimmed) return null
      return {
        label: trimmed,
        ...(color ? { color } : {}),
      }
    })
    .filter((option): option is ChoiceOption => Boolean(option))
}

export function findOptionColor(options: ChoiceOption[] | undefined, value: string) {
  if (!options || !value) return undefined
  const normalizedValue = value.trim()
  const entry = options.find((option) => option.label === normalizedValue)
  return entry?.color
}
