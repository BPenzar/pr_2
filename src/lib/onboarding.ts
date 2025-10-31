import { supabase } from '@/lib/supabase-client'

/**
 * Check if a user needs to go through onboarding
 * A user needs onboarding if they have no projects
 */
export async function checkOnboardingStatus(accountId: string): Promise<{
  needsOnboarding: boolean
  projectCount: number
}> {
  try {
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('onboarding_completed')
      .eq('id', accountId)
      .single()

    if (accountError) {
      console.error('Error loading account status:', accountError)
    }

    if (account?.onboarding_completed) {
      return { needsOnboarding: false, projectCount: 0 }
    }

    const { data: projects, error } = await supabase
      .from('projects')
      .select('id')
      .eq('account_id', accountId)

    if (error) {
      console.error('Error checking onboarding status:', error)
      return { needsOnboarding: false, projectCount: 0 }
    }

    const projectCount = projects?.length || 0
    const needsOnboarding = projectCount === 0

    return { needsOnboarding, projectCount }
  } catch (error) {
    console.error('Error checking onboarding status:', error)
    return { needsOnboarding: false, projectCount: 0 }
  }
}

/**
 * Mark onboarding as completed for a user
 */
export async function markOnboardingCompleted(accountId: string): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .update({
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', accountId)
      .select('id')
      .maybeSingle()

    if (error || !data) {
      console.error('Error marking onboarding as completed:', error ?? 'No rows updated')
    }
  } catch (error) {
    console.error('Error marking onboarding as completed:', error)
  }
}
