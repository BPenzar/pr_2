'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase-client'
import { Question } from '@/types/database'

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
      return data as Question[]
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
      options?: string[]
      rating_scale?: number
      orderIndex: number
    }) => {
      const { data: question, error } = await supabase
        .from('questions')
        .insert({
          form_id: data.formId,
          type: data.type,
          title: data.title,
          description: data.description,
          required: data.required,
          options: data.options,
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
      options?: string[]
      rating_scale?: number
      orderIndex?: number
    }) => {
      const updateData: any = {}
      if (data.title !== undefined) updateData.title = data.title
      if (data.description !== undefined) updateData.description = data.description
      if (data.required !== undefined) updateData.required = data.required
      if (data.options !== undefined) updateData.options = data.options
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
    mutationFn: async (data: {
      formId: string
      questions: { id: string; orderIndex: number }[]
    }) => {
      // Update all questions in a single transaction
      const updates = data.questions.map(q =>
        supabase
          .from('questions')
          .update({ order_index: q.orderIndex })
          .eq('id', q.id)
      )

      const results = await Promise.all(updates)

      // Check for errors
      for (const result of results) {
        if (result.error) throw result.error
      }

      return data.questions
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['form', variables.formId] })
      queryClient.invalidateQueries({ queryKey: ['questions', variables.formId] })
    },
  })
}
