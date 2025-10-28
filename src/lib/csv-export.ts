export interface ExportableResponse {
  id: string
  submitted_at: string
  ip_hash?: string
  user_agent?: string
  items: Array<{
    id: string
    question_id: string
    question_title: string
    question_type: string
    text_value?: string
    number_value?: number
    choice_values?: string[]
  }>
}

export interface ExportableForm {
  id: string
  name: string
  description?: string
  questions: Array<{
    id: string
    title: string
    description?: string
    type: string
    required: boolean
    order_index: number
  }>
}

/**
 * Converts form responses to CSV format
 */
export function exportResponsesToCSV(
  responses: ExportableResponse[],
  form: ExportableForm,
  includeMetadata = true
): string {
  if (!responses.length) {
    return 'No data to export'
  }

  // Create headers
  const headers: string[] = []

  if (includeMetadata) {
    headers.push('Response ID', 'Submitted At', 'IP Hash', 'User Agent')
  }

  // Add question headers in order
  const sortedQuestions = form.questions.sort((a, b) => a.order_index - b.order_index)
  sortedQuestions.forEach(question => {
    headers.push(escapeCSVValue(question.title))
  })

  // Create rows
  const rows: string[] = []
  rows.push(headers.join(','))

  responses.forEach(response => {
    const row: string[] = []

    if (includeMetadata) {
      row.push(
        escapeCSVValue(response.id),
        escapeCSVValue(new Date(response.submitted_at).toLocaleString()),
        escapeCSVValue(response.ip_hash || ''),
        escapeCSVValue(response.user_agent || '')
      )
    }

    // Add response values for each question
    sortedQuestions.forEach(question => {
      const item = response.items.find(item => item.question_id === question.id)
      let value = ''

      if (item) {
        switch (question.type) {
          case 'text':
          case 'textarea':
            value = item.text_value || ''
            break
          case 'rating':
            value = item.number_value?.toString() || ''
            break
          case 'choice':
            value = item.choice_values?.[0] || ''
            break
          case 'multiselect':
            value = item.choice_values?.join('; ') || ''
            break
          default:
            value = item.text_value || item.number_value?.toString() || ''
        }
      }

      row.push(escapeCSVValue(value))
    })

    rows.push(row.join(','))
  })

  return rows.join('\n')
}

/**
 * Exports form structure to CSV (questions only)
 */
export function exportFormStructureToCSV(form: ExportableForm): string {
  const headers = ['Question Order', 'Question Title', 'Description', 'Type', 'Required']
  const rows: string[] = []
  rows.push(headers.join(','))

  const sortedQuestions = form.questions.sort((a, b) => a.order_index - b.order_index)

  sortedQuestions.forEach((question, index) => {
    const row = [
      (index + 1).toString(),
      escapeCSVValue(question.title),
      escapeCSVValue(question.description || ''),
      escapeCSVValue(question.type),
      question.required ? 'Yes' : 'No'
    ]
    rows.push(row.join(','))
  })

  return rows.join('\n')
}

/**
 * Downloads CSV content as a file
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

/**
 * Escapes CSV values to handle commas, quotes, and newlines
 */
function escapeCSVValue(value: string): string {
  if (!value) return ''

  // Convert to string if not already
  const stringValue = String(value)

  // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

/**
 * Generates a safe filename for CSV export
 */
export function generateCSVFilename(formName: string, type: 'responses' | 'structure' = 'responses'): string {
  const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const safeName = formName.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_')
  return `${safeName}_${type}_${timestamp}.csv`
}