'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase-client'
import { useAuth } from '@/contexts/auth-context'

export interface Plan {
  id: string
  name: string
  price_monthly: number
  price_yearly: number
  max_projects: number
  max_forms_per_project: number
  max_responses_per_month: number
  max_qr_codes_per_form: number
  features: string[]
  is_active: boolean
  created_at: string
}

const normalizePlan = (plan: any): Plan => {
  const priceCents = typeof plan?.price === 'number' ? plan.price : 0
  const monthly = priceCents / 100
  const yearly = monthly * 12

  const features = Array.isArray(plan?.features)
    ? plan.features
    : typeof plan?.features === 'string'
      ? (() => {
          try {
            const parsed = JSON.parse(plan.features)
            return Array.isArray(parsed) ? parsed : []
          } catch (error) {
            return []
          }
        })()
      : []

  return {
    id: plan?.id ?? '',
    name: plan?.name ?? 'Unknown',
    price_monthly: Number.isFinite(monthly) ? parseFloat(monthly.toFixed(2)) : 0,
    price_yearly: Number.isFinite(yearly) ? parseFloat(yearly.toFixed(2)) : 0,
    max_projects: typeof plan?.max_projects === 'number' ? plan.max_projects : -1,
    max_forms_per_project: typeof plan?.max_forms_per_project === 'number' ? plan.max_forms_per_project : -1,
    max_responses_per_month:
      typeof plan?.max_responses_per_month === 'number'
        ? plan.max_responses_per_month
        : typeof plan?.max_responses_per_form === 'number'
          ? plan.max_responses_per_form
          : -1,
    max_qr_codes_per_form: typeof plan?.max_qr_codes_per_form === 'number' ? plan.max_qr_codes_per_form : -1,
    features,
    is_active: plan?.is_active ?? true,
    created_at: plan?.created_at ?? new Date().toISOString(),
  }
}

export interface UsageData {
  projects: number
  forms: number
  responses_this_month: number
  qr_codes: number
}

export interface PlanLimits {
  projects: { current: number; limit: number }
  forms: { current: number; limit: number }
  responses: { current: number; limit: number }
  qrCodes: { current: number; limit: number }
}

/**
 * Get all available plans
 */
export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true })

      if (error) throw error
      return (data ?? []).map(normalizePlan)
    },
  })
}

/**
 * Get current account plan and usage
 */
export function useAccountPlan() {
  const { account } = useAuth()

  return useQuery({
    queryKey: ['account-plan', account?.id],
    queryFn: async () => {
      if (!account?.id) throw new Error('No account')

      // Get account with plan and usage data
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .select(`
          *,
          plan:plans(*),
          usage_counters(*)
        `)
        .eq('id', account.id)
        .single()

      if (accountError) throw accountError

      // Get current month's response count
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { data: responseCount, error: responseError } = await supabase
        .rpc('get_account_responses_count', {
          account_uuid: account.id,
          start_date: startOfMonth.toISOString()
        })

      if (responseError) {
        console.warn('Error getting response count:', responseError)
      }

      return {
        account: accountData,
        plan: normalizePlan(accountData.plan),
        usage: {
          projects: accountData.usage_counters?.projects_count || 0,
          forms: accountData.usage_counters?.forms_count || 0,
          responses_this_month: responseCount || 0,
          qr_codes: accountData.usage_counters?.qr_codes_count || 0,
        } as UsageData,
      }
    },
    enabled: !!account?.id,
  })
}

/**
 * Get formatted plan limits with current usage
 */
export function usePlanLimits(): PlanLimits | null {
  const { data } = useAccountPlan()

  if (!data) return null

  const { plan, usage } = data

  const resolvedPlan = plan || normalizePlan({})

  const totalProjectCapacity =
    resolvedPlan.max_projects === -1
      ? Math.max(usage.projects, 1)
      : resolvedPlan.max_projects

  const totalFormCapacity =
    resolvedPlan.max_forms_per_project === -1
      ? -1
      : resolvedPlan.max_forms_per_project * totalProjectCapacity

  const totalQrCapacity =
    resolvedPlan.max_qr_codes_per_form === -1 || totalFormCapacity === -1
      ? -1
      : resolvedPlan.max_qr_codes_per_form * totalFormCapacity

  return {
    projects: {
      current: usage.projects,
      limit: resolvedPlan.max_projects
    },
    forms: {
      current: usage.forms,
      limit: totalFormCapacity
    },
    responses: {
      current: usage.responses_this_month,
      limit: resolvedPlan.max_responses_per_month
    },
    qrCodes: {
      current: usage.qr_codes,
      limit: totalQrCapacity
    }
  }
}

/**
 * Check if a specific action is allowed based on plan limits
 */
export function useCanPerformAction() {
  const planLimits = usePlanLimits()

  return {
    canCreateProject: () => {
      if (!planLimits) return false
      const { current, limit } = planLimits.projects
      return limit === -1 || current < limit
    },

    canCreateForm: () => {
      if (!planLimits) return false
      const { current, limit } = planLimits.forms
      return limit === -1 || current < limit
    },

    canAcceptResponse: () => {
      if (!planLimits) return false
      const { current, limit } = planLimits.responses
      return limit === -1 || current < limit
    },

    canCreateQRCode: () => {
      if (!planLimits) return false
      const { current, limit } = planLimits.qrCodes
      return limit === -1 || current < limit
    },

    getRemainingQuota: (type: 'projects' | 'forms' | 'responses' | 'qrCodes') => {
      if (!planLimits) return 0
      const { current, limit } = planLimits[type]
      if (limit === -1) return Infinity
      return Math.max(0, limit - current)
    },

    getUsagePercentage: (type: 'projects' | 'forms' | 'responses' | 'qrCodes') => {
      if (!planLimits) return 0
      const { current, limit } = planLimits[type]
      if (limit === -1) return 0
      return Math.min((current / limit) * 100, 100)
    }
  }
}

/**
 * Initiate plan upgrade process
 */
export function useUpgradePlan() {
  const queryClient = useQueryClient()
  const { account } = useAuth()

  return useMutation({
    mutationFn: async (planId: string) => {
      if (!account?.id) throw new Error('No account')

      // In a real implementation, this would:
      // 1. Create a Stripe checkout session
      // 2. Redirect to payment page
      // 3. Handle webhooks to update plan after payment

      // For now, we'll just log the upgrade intent
      console.log('Upgrade initiated:', { accountId: account.id, planId })

      // Simulate upgrade process
      return {
        checkoutUrl: '/upgrade/checkout',
        sessionId: 'mock_session_id'
      }
    },
    onSuccess: () => {
      // Invalidate plan queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['account-plan'] })
      queryClient.invalidateQueries({ queryKey: ['plans'] })
    },
  })
}

/**
 * Cancel plan subscription
 */
export function useCancelPlan() {
  const queryClient = useQueryClient()
  const { account } = useAuth()

  return useMutation({
    mutationFn: async () => {
      if (!account?.id) throw new Error('No account')

      // In a real implementation, this would cancel the Stripe subscription
      console.log('Plan cancellation initiated:', { accountId: account.id })

      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-plan'] })
    },
  })
}

/**
 * Get plan recommendations based on usage
 */
export function usePlanRecommendations() {
  const { data } = useAccountPlan()
  const { data: plans } = usePlans()

  if (!data || !plans) return null

  const { plan: currentPlan, usage } = data

  // Find plans that would accommodate current usage
  const recommendedPlans = plans.filter(plan => {
    if (plan.id === currentPlan.id) return false

    return (
      (plan.max_projects === -1 || usage.projects <= plan.max_projects) &&
      (plan.max_responses_per_month === -1 || usage.responses_this_month <= plan.max_responses_per_month) &&
      plan.price_monthly > currentPlan.price_monthly // Only recommend upgrades
    )
  })

  return {
    currentPlan,
    recommendedPlans,
    shouldUpgrade: usage.projects >= currentPlan.max_projects ||
                   usage.responses_this_month >= currentPlan.max_responses_per_month,
    usage
  }
}
