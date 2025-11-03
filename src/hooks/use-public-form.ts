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
            questions:questions(
              id,
              type,
              title,
              description,
              required,
              options,
              rating_scale,
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

      // Sort and normalize question data
      const formRecord = qrCode.form as any
      const formId = formRecord.id

      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('form_id', formId)
        .order('order_index', { ascending: true })

      if (questionsError) {
        throw questionsError
      }

      const sortedQuestions = (questions ?? [])
        .map((question: any) => {
          if (question.type !== 'rating') {
            return question
          }

          const parsedScale = Number(question.rating_scale)
          const ratingScale = Number.isFinite(parsedScale) && parsedScale > 0 ? parsedScale : 10
          return {
            ...question,
            rating_scale: ratingScale,
          }
        })

      const normalizedQuestions = sortedQuestions.map((question: any) => ({
        ...question,
        rating_scale:
          typeof question.rating_scale === 'number'
            ? question.rating_scale
            : Number(question.rating_scale),
      }))

      if (process.env.NODE_ENV !== 'production') {
        console.log(
          '[PublicForm] Loaded questions',
          normalizedQuestions.map((question: any) => ({
            id: question.id,
            type: question.type,
            rating_scale: question.rating_scale,
          }))
        )
      }

      return {
        qrCodeId: qrCode.id,
        locationName: qrCode.location_name,
        form: {
          ...formRecord,
          questions: normalizedQuestions,
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
