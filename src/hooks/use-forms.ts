'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase-client'
import { Form, Question } from '@/types/database'
import { useAuth } from '@/contexts/auth-context'
import { ensureDefaultQRCode } from '@/lib/qr-codes'
import { normalizeChoiceOptions } from '@/lib/question-utils'

export function useForms(projectId?: string) {
  const { account } = useAuth()

  return useQuery({
    queryKey: ['forms', projectId],
    queryFn: async () => {
      if (!projectId) return []

      const { data, error } = await supabase
        .from('forms')
        .select(`
          *,
          questions:questions(
            id,
            type,
            title,
            required,
            order_index
          ),
          responses:responses(count)
        `)
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as (Form & {
        questions: Pick<Question, 'id' | 'type' | 'title' | 'required' | 'order_index'>[],
        responses: { count: number }[]
      })[]
    },
    enabled: !!projectId && !!account?.id,
  })
}

export function useForm(formId: string) {
  return useQuery({
    queryKey: ['form', formId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forms')
        .select(`
          *,
          project:projects(id, name, account_id),
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
        `)
        .eq('id', formId)
        .single()

      if (error) throw error
      return {
        ...data,
        questions: data.questions?.map((question: any) => ({
          ...question,
          options: normalizeChoiceOptions(question.options),
        })),
      }
    },
    enabled: !!formId,
  })
}

export function useCreateForm() {
  const queryClient = useQueryClient()
  const { account } = useAuth()

  return useMutation({
    mutationFn: async (data: {
      projectId: string
      name: string
      description?: string
    }) => {
      if (!account?.id) throw new Error('No account found')

      // Check if user can create more forms for this project
      const { data: canCreate, error: limitError } = await supabase
        .rpc('can_create_form', { project_uuid: data.projectId })

      if (limitError) throw limitError
      if (!canCreate) throw new Error('Form limit reached')

      const { data: form, error } = await supabase
        .from('forms')
        .insert({
          project_id: data.projectId,
          name: data.name,
          description: data.description,
        })
        .select()
        .single()

      if (error) throw error

      try {
        await ensureDefaultQRCode(form.id)
      } catch (qrError: any) {
        throw new Error(qrError?.message || 'Failed to generate default QR code')
      }
      return form
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['forms', data.project_id] })
      queryClient.invalidateQueries({ queryKey: ['project', data.project_id] })
      if (account?.id) {
        queryClient.invalidateQueries({ queryKey: ['account-plan', account.id] })
        queryClient.invalidateQueries({ queryKey: ['account-analytics', account.id] })
      }
    },
  })
}

export function useUpdateForm() {
  const queryClient = useQueryClient()
  const { account } = useAuth()

  return useMutation({
    mutationFn: async (data: {
      id: string
      name: string
      description?: string | null
      is_active?: boolean
      submission_layout?: 'single' | 'step'
      questions_per_step?: number
    }) => {
      const questionsPerStep =
        typeof data.questions_per_step === 'number' && Number.isFinite(data.questions_per_step)
          ? Math.max(1, Math.floor(data.questions_per_step))
          : undefined
      const { data: form, error } = await supabase
        .from('forms')
        .update({
          name: data.name,
          description: data.description,
          is_active: data.is_active,
          submission_layout: data.submission_layout,
          questions_per_step: questionsPerStep,
        })
        .eq('id', data.id)
        .select()
        .single()

      if (error) throw error
      return form
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['form', data.id] })
      queryClient.invalidateQueries({ queryKey: ['forms', data.project_id] })
      if (account?.id) {
        queryClient.invalidateQueries({ queryKey: ['account-plan', account.id] })
        queryClient.invalidateQueries({ queryKey: ['account-analytics', account.id] })
      }
    },
  })
}

type DeleteFormArgs = { formId: string; projectId?: string }

export function useDeleteForm() {
  const queryClient = useQueryClient()
  const { account } = useAuth()

  return useMutation({
    mutationFn: async ({ formId }: DeleteFormArgs) => {
      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', formId)

      if (error) throw error
    },
    onSuccess: (_, { formId, projectId }: DeleteFormArgs) => {
      queryClient.invalidateQueries({ queryKey: ['form', formId] })
      queryClient.invalidateQueries({ queryKey: ['forms'] })
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      }
      if (account?.id) {
        queryClient.invalidateQueries({ queryKey: ['account-plan', account.id] })
        queryClient.invalidateQueries({ queryKey: ['account-analytics', account.id] })
      }
    },
  })
}
