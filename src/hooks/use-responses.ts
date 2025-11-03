'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase-client'
import { Response, ResponseItem } from '@/types/database'
import { useAuth } from '@/contexts/auth-context'
import { normalizeChoiceOptions } from '@/lib/question-utils'

export function useResponses(formId?: string) {
  const { account } = useAuth()

  return useQuery({
    queryKey: ['responses', formId],
    queryFn: async () => {
      if (!formId) return []

      const { data, error } = await supabase
        .from('responses')
        .select(`
          *,
          response_items:response_items(
            id,
            question_id,
            value,
            questions:questions(
              id,
              title,
              type,
              options,
              rating_scale
            )
          ),
          qr_codes:qr_codes(
            id,
            location_name,
            short_url
          )
        `)
        .eq('form_id', formId)
        .order('submitted_at', { ascending: false })

      if (error) throw error
      return (data as (Response & {
        response_items: (ResponseItem & {
          questions: {
            id: string
            title: string
            type: string
            options?: any
            rating_scale?: number
          }
        })[]
        qr_codes: {
          id: string
          location_name?: string
          short_url: string
        }
      })[]).map((response) => ({
        ...response,
        response_items: response.response_items.map((item) => ({
          ...item,
          questions: {
            ...item.questions,
            options: normalizeChoiceOptions(item.questions?.options),
          },
        })),
      }))
    },
    enabled: !!formId && !!account?.id,
  })
}

export function useFormAnalytics(formId?: string) {
  const { account } = useAuth()

  return useQuery({
    queryKey: ['form-analytics', formId],
    queryFn: async () => {
      if (!formId) return null

      // Get basic form info and stats
      const { data: form, error: formError } = await supabase
        .from('forms')
        .select(`
          id,
          name,
          created_at,
          project:projects(
            id,
            name,
            account_id
          )
        `)
        .eq('id', formId)
        .single()

      if (formError) throw formError

      // Get response count by day (last 30 days)
      const { data: dailyResponses, error: dailyError } = await supabase
        .from('response_trends')
        .select('response_date, responses_count')
        .eq('form_id', formId)
        .gte('response_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('response_date', { ascending: true })

      if (dailyError) console.warn('Failed to get daily responses:', dailyError)

      const { data: fallbackResponses, error: fallbackError } = await supabase
        .from('responses')
        .select('submitted_at')
        .eq('form_id', formId)
        .gte('submitted_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      if (fallbackError) console.warn('Failed to get fallback response timeline:', fallbackError)

      let trendData = dailyResponses || []
      if (fallbackResponses && fallbackResponses.length) {
        const fallbackAggregatedMap = fallbackResponses.reduce((acc: Map<string, number>, row: { submitted_at: string }) => {
          const dateKey = row.submitted_at ? new Date(row.submitted_at).toISOString().slice(0, 10) : null
          if (!dateKey) return acc
          acc.set(dateKey, (acc.get(dateKey) || 0) + 1)
          return acc
        }, new Map<string, number>())

        const fallbackAggregated = Array.from(fallbackAggregatedMap.entries())
          .map(([response_date, responses_count]) => ({ response_date, responses_count }))
          .sort((a, b) => (a.response_date < b.response_date ? -1 : 1))

        if (!trendData || trendData.length === 0) {
          trendData = fallbackAggregated
        } else {
          const latestTrend = trendData[trendData.length - 1]?.response_date
          const latestFallback = fallbackAggregated[fallbackAggregated.length - 1]?.response_date
          if (latestTrend && latestFallback && latestFallback > latestTrend) {
            trendData = fallbackAggregated
          }
        }
      }

      // Get total responses count
      const { count: totalResponses, error: countError } = await supabase
        .from('responses')
        .select('*', { count: 'exact', head: true })
        .eq('form_id', formId)

      if (countError) console.warn('Failed to get total count:', countError)

      // Get QR scan stats
      const { data: qrStats, error: qrError } = await supabase
        .from('qr_codes')
        .select('id, location_name, scan_count')
        .eq('form_id', formId)

      if (qrError) console.warn('Failed to get QR stats:', qrError)

      // Get responses by location
      const { data: locationStats, error: locationError } = await supabase
        .from('responses')
        .select('location_name')
        .eq('form_id', formId)
        .not('location_name', 'is', null)

      if (locationError) console.warn('Failed to get location stats:', locationError)

      // Calculate location distribution
      const locationCounts: Record<string, number> = {}
      locationStats?.forEach(response => {
        if (response.location_name) {
          locationCounts[response.location_name] = (locationCounts[response.location_name] || 0) + 1
        }
      })

      // Calculate total QR scans
      const totalScans = qrStats?.reduce((sum, qr) => sum + qr.scan_count, 0) || 0

      // Calculate conversion rate
      const conversionRate = totalScans > 0 ? ((totalResponses || 0) / totalScans * 100) : 0

      return {
        form,
        totalResponses: totalResponses || 0,
        totalScans,
        conversionRate: Math.round(conversionRate * 100) / 100,
        dailyResponses: trendData,
        qrStats: qrStats || [],
        locationStats: Object.entries(locationCounts).map(([location, count]) => ({
          location,
          count,
        })),
      }
    },
    enabled: !!formId && !!account?.id,
  })
}

export function useProjectAnalytics(projectId?: string) {
  const { account } = useAuth()

  return useQuery({
    queryKey: ['project-analytics', projectId],
    queryFn: async () => {
      if (!projectId) return null

      // Use materialized view for better performance
      const { data: summary, error } = await supabase
        .from('dashboard_summary')
        .select('*')
        .eq('project_id', projectId)
        .single()

      if (error) throw error

      return summary
    },
    enabled: !!projectId && !!account?.id,
  })
}

export function useAccountAnalytics() {
  const { account } = useAuth()

  return useQuery({
    queryKey: ['account-analytics', account?.id],
    queryFn: async () => {
      if (!account?.id) return null

      // Get summary for all projects
      const { data: summaries, error } = await supabase
        .from('dashboard_summary')
        .select('*')
        .eq('account_id', account.id)

      if (error) throw error

      // Aggregate the data
      const totals = summaries.reduce(
        (acc, project) => ({
          projects: acc.projects + 1,
          forms: acc.forms + project.forms_count,
          responses: acc.responses + project.total_responses,
          qrCodes: acc.qrCodes + project.qr_codes_count,
          scans: acc.scans + project.total_scans,
        }),
        { projects: 0, forms: 0, responses: 0, qrCodes: 0, scans: 0 }
      )

      return {
        totals,
        projects: summaries,
      }
    },
    enabled: !!account?.id,
  })
}

export function useDeleteResponse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (responseId: string) => {
      const { error } = await supabase
        .from('responses')
        .delete()
        .eq('id', responseId)

      if (error) throw error
    },
    onSuccess: () => {
      // Invalidate all response-related queries
      queryClient.invalidateQueries({ queryKey: ['responses'] })
      queryClient.invalidateQueries({ queryKey: ['form-analytics'] })
      queryClient.invalidateQueries({ queryKey: ['project-analytics'] })
      queryClient.invalidateQueries({ queryKey: ['account-analytics'] })
    },
  })
}
