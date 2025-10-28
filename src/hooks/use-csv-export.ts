import { useMutation } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import {
  exportResponsesToCSV,
  exportFormStructureToCSV,
  downloadCSV,
  generateCSVFilename,
  type ExportableResponse,
  type ExportableForm
} from '@/lib/csv-export'

interface ExportResponsesParams {
  responses: ExportableResponse[]
  form: ExportableForm
  includeMetadata?: boolean
}

interface ExportStructureParams {
  form: ExportableForm
}

/**
 * Hook for exporting form responses to CSV
 */
export function useExportResponses() {
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ responses, form, includeMetadata = true }: ExportResponsesParams) => {
      if (!responses.length) {
        throw new Error('No responses to export')
      }

      const csvContent = exportResponsesToCSV(responses, form, includeMetadata)
      const filename = generateCSVFilename(form.name, 'responses')

      downloadCSV(csvContent, filename)

      return { filename, count: responses.length }
    },
    onSuccess: (result) => {
      toast({
        title: 'Export successful',
        description: `Exported ${result.count} responses to ${result.filename}`,
      })
    },
    onError: (error) => {
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Failed to export responses',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Hook for exporting form structure to CSV
 */
export function useExportFormStructure() {
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ form }: ExportStructureParams) => {
      if (!form.questions.length) {
        throw new Error('No questions to export')
      }

      const csvContent = exportFormStructureToCSV(form)
      const filename = generateCSVFilename(form.name, 'structure')

      downloadCSV(csvContent, filename)

      return { filename, count: form.questions.length }
    },
    onSuccess: (result) => {
      toast({
        title: 'Export successful',
        description: `Exported ${result.count} questions to ${result.filename}`,
      })
    },
    onError: (error) => {
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Failed to export form structure',
        variant: 'destructive',
      })
    },
  })
}