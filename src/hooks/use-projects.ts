'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase-client'
import { Project } from '@/types/database'
import { useAuth } from '@/contexts/auth-context'

type ProjectUsage = {
  forms_count: number
  responses_count: number
  qr_codes_count: number
}

export function useProjects() {
  const { account } = useAuth()

  return useQuery({
    queryKey: ['projects', account?.id],
    queryFn: async () => {
      if (!account?.id) return []

      const [projectsResponse, usageResponse] = await Promise.all([
        supabase
          .from('projects')
          .select('*')
          .eq('account_id', account.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        supabase.rpc('get_project_usage_summary', { account_uuid: account.id }),
      ])

      if (projectsResponse.error) throw projectsResponse.error
      if (usageResponse.error) throw usageResponse.error

      const usageMap = new Map<string, ProjectUsage>(
        (usageResponse.data ?? []).map((entry: any) => [
          entry.project_id,
          {
            forms_count: entry.forms_count ?? 0,
            responses_count: entry.responses_count ?? 0,
            qr_codes_count: entry.qr_codes_count ?? 0,
          } satisfies ProjectUsage,
        ])
      )

      return (projectsResponse.data ?? []).map((project: Project) => ({
        ...project,
        usage: usageMap.get(project.id) ?? {
          forms_count: 0,
          responses_count: 0,
          qr_codes_count: 0,
        },
      })) as Array<Project & { usage: ProjectUsage }>
    },
    enabled: !!account?.id,
    refetchInterval: 30 * 1000,
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
            updated_at,
            responses:responses(count),
            qr_codes:qr_codes(count)
          )
        `)
        .eq('id', projectId)
        .eq('account_id', account?.id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!projectId && !!account?.id,
    refetchInterval: 30 * 1000,
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
      if (!canCreate) throw new Error('Project limit reached')

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
      if (account?.id) {
        queryClient.invalidateQueries({ queryKey: ['account-plan', account.id] })
        queryClient.invalidateQueries({ queryKey: ['account-analytics', account.id] })
      }
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()
  const { account } = useAuth()

  return useMutation({
    mutationFn: async (data: { id: string; name: string; description: string | null }) => {
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
        .delete()
        .eq('id', projectId)
        .eq('account_id', account?.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', account?.id] })
      if (account?.id) {
        queryClient.invalidateQueries({ queryKey: ['account-plan', account.id] })
        queryClient.invalidateQueries({ queryKey: ['account-analytics', account.id] })
      }
    },
  })
}
