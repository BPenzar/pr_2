'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase-client'
import { Project } from '@/types/database'
import { useAuth } from '@/contexts/auth-context'

export function useProjects() {
  const { account } = useAuth()

  return useQuery({
    queryKey: ['projects', account?.id],
    queryFn: async () => {
      if (!account?.id) return []

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          forms:forms(count)
        `)
        .eq('account_id', account.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as (Project & { forms: { count: number }[] })[]
    },
    enabled: !!account?.id,
  })
}

export function useProject(projectId: string) {
  const { account } = useAuth()

  return useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          forms:forms(
            id,
            name,
            description,
            is_active,
            created_at,
            responses:responses(count)
          )
        `)
        .eq('id', projectId)
        .eq('account_id', account?.id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!projectId && !!account?.id,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  const { account } = useAuth()

  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      if (!account?.id) throw new Error('No account found')

      // Check if user can create more projects
      const { data: canCreate, error: limitError } = await supabase
        .rpc('can_create_project', { account_uuid: account.id })

      if (limitError) throw limitError
      if (!canCreate) throw new Error('Project limit reached for your plan')

      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          account_id: account.id,
          name: data.name,
          description: data.description,
        })
        .select()
        .single()

      if (error) throw error
      return project
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', account?.id] })
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()
  const { account } = useAuth()

  return useMutation({
    mutationFn: async (data: { id: string; name: string; description?: string }) => {
      const { data: project, error } = await supabase
        .from('projects')
        .update({
          name: data.name,
          description: data.description,
        })
        .eq('id', data.id)
        .eq('account_id', account?.id)
        .select()
        .single()

      if (error) throw error
      return project
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects', account?.id] })
      queryClient.invalidateQueries({ queryKey: ['project', data.id] })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  const { account } = useAuth()

  return useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from('projects')
        .update({ is_active: false })
        .eq('id', projectId)
        .eq('account_id', account?.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', account?.id] })
    },
  })
}