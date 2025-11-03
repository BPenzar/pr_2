'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase-client'
import { Question } from '@/types/database'
import {
  ChoiceOption,
  normalizeChoiceOptions,
  sanitizeChoiceOptions,
} from '@/lib/question-utils'

export function useQuestions(formId?: string) {
  return useQuery({
    queryKey: ['questions', formId],
    queryFn: async () => {
      if (!formId) return []

      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('form_id', formId)
        .order('order_index', { ascending: true })

      if (error) throw error
      return (data as Question[]).map((question) => ({
        ...question,
        options: normalizeChoiceOptions(question.options),
      }))
    },
    enabled: !!formId,
  })
}

export function useCreateQuestion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      formId: string
      type: Question['type']
      title: string
      description?: string
      required: boolean
      options?: ChoiceOption[]
      rating_scale?: number
      orderIndex: number
    }) => {
      const sanitizedOptionsRaw = data.options ? sanitizeChoiceOptions(data.options) : undefined
      const sanitizedOptions = sanitizedOptionsRaw && sanitizedOptionsRaw.length ? sanitizedOptionsRaw : null

      const { data: question, error } = await supabase
        .from('questions')
        .insert({
          form_id: data.formId,
          type: data.type,
          title: data.title,
          description: data.description,
          required: data.required,
          options: sanitizedOptions,
          rating_scale: data.rating_scale,
          order_index: data.orderIndex,
        })
        .select()
        .single()

      if (error) throw error
      return question
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['form', data.form_id] })
      queryClient.invalidateQueries({ queryKey: ['questions', data.form_id] })
    },
  })
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      id: string
      formId: string
      title?: string
      description?: string
      required?: boolean
      options?: ChoiceOption[]
      rating_scale?: number
      orderIndex?: number
    }) => {
      const updateData: any = {}
      if (data.title !== undefined) updateData.title = data.title
      if (data.description !== undefined) updateData.description = data.description
      if (data.required !== undefined) updateData.required = data.required
      if (data.options !== undefined) {
        const sanitized = sanitizeChoiceOptions(data.options)
        updateData.options = sanitized.length ? sanitized : null
      }
      if (data.rating_scale !== undefined) updateData.rating_scale = data.rating_scale
      if (data.orderIndex !== undefined) updateData.order_index = data.orderIndex

      const { data: question, error } = await supabase
        .from('questions')
        .update(updateData)
        .eq('id', data.id)
        .select()
        .single()

      if (error) throw error
      return question
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['form', variables.formId] })
      queryClient.invalidateQueries({ queryKey: ['questions', variables.formId] })
    },
  })
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { id: string; formId: string }) => {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', data.id)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['form', variables.formId] })
      queryClient.invalidateQueries({ queryKey: ['questions', variables.formId] })
    },
  })
}

export function useReorderQuestions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      formId,
      questions,
    }: {
      formId: string
      questions: { id: string; orderIndex: number }[]
    }) => {
      if (questions.length === 0) {
        return questions
      }

      const { error } = await supabase.rpc('reorder_questions', {
        form_uuid: formId,
        question_ids: questions.map((q) => q.id),
        order_indexes: questions.map((q) => q.orderIndex),
      })

      if (error) {
        throw error
      }

      return questions
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['form', variables.formId] })
      queryClient.invalidateQueries({ queryKey: ['questions', variables.formId] })
    },
  })
}
