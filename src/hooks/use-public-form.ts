'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase-client'

export function usePublicForm(shortUrl: string) {
  return useQuery({
    queryKey: ['public-form', shortUrl],
    queryFn: async () => {
      // First get the QR code record to find the form
      const { data: qrCode, error: qrError } = await supabase
        .from('qr_codes')
        .select(`
          id,
          form_id,
          location_name,
          form:forms(
            id,
            name,
            description,
            is_active,
            project:projects(
              id,
              name,
              account_id
            ),
            questions:questions(
              id,
              type,
              title,
              description,
              required,
              options,
              order_index
            )
          )
        `)
        .eq('short_url', shortUrl)
        .single()

      if (qrError) throw qrError

      if (!(qrCode.form as any).is_active) {
        throw new Error('This form is no longer active')
      }

      // Increment scan count
      try {
        await supabase.rpc('increment_qr_scan', {
          qr_code_uuid: qrCode.id,
        })
      } catch (error) {
        console.warn('Failed to increment scan count:', error)
      }

      // Sort questions by order
      const sortedQuestions = (qrCode.form as any).questions.sort(
        (a: any, b: any) => a.order_index - b.order_index
      )

      return {
        qrCodeId: qrCode.id,
        locationName: qrCode.location_name,
        form: {
          ...qrCode.form,
          questions: sortedQuestions,
        },
      }
    },
    enabled: !!shortUrl,
    retry: false, // Don't retry on error for public forms
  })
}

export function useSubmitResponse() {
  return useMutation({
    mutationFn: async (data: {
      formId: string
      qrCodeId?: string
      locationName?: string
      responses: Record<string, string | string[]>
      // Anti-spam fields
      honeypotValue?: string
      formLoadToken?: string
      captchaQuestion?: string
      captchaAnswer?: string
    }) => {
      const response = await fetch('/api/submit-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          userAgent: navigator.userAgent,
          referrer: document.referrer,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        const error = new Error(result.error || 'Submission failed')
        ;(error as any).type = result.type
        throw error
      }

      return result
    },
  })
}