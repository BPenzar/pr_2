'use client'

import { useMemo, useState } from 'react'
import { useAccountPlan, usePlans, useUpgradePlan, usePlanLimits } from '@/hooks/use-plans'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UsageMeter } from '@/components/upgrade/usage-meter'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CrownIcon,
  CheckIcon,
  SparklesIcon,
  CreditCardIcon,
  TrendingUpIcon,
  InfoIcon,
  SettingsIcon,
  ArrowLeftIcon
} from 'lucide-react'
import Link from 'next/link'

const PLAN_ORDER = ['Free', 'Starter', 'Professional'] as const
const UNIVERSAL_FEATURES = [
  'Unlimited QR codes per form',
  'Advanced Analytics',
  'QR Codes',
  'Export CSV',
  'Custom Branding'
] as const

export default function BillingPage() {
  const { data: accountData, isLoading: isLoadingAccount } = useAccountPlan()
  const { data: plans, isLoading: isLoadingPlans } = usePlans()
  const planLimits = usePlanLimits()
  const upgradePlan = useUpgradePlan()
  const [isYearly, setIsYearly] = useState(false)

  const orderedPlans = useMemo(() => {
    if (!plans?.length) return []

    const prioritized = PLAN_ORDER
      .map((name) => plans.find((plan) => plan.name === name))
      .filter((plan): plan is NonNullable<typeof plan> => Boolean(plan))

    return prioritized.length ? prioritized : plans
  }, [plans])

  const currentPlan = useMemo(() => {
    if (!accountData?.plan) return null
    return orderedPlans.find((plan) => plan.id === accountData.plan.id) ?? accountData.plan
  }, [orderedPlans, accountData?.plan])

  const nextPlanForUpgrade = useMemo(() => {
    if (!orderedPlans.length || !currentPlan) return null

    return orderedPlans
      .filter((plan) => plan.price_monthly > currentPlan.price_monthly)
      .sort((a, b) => a.price_monthly - b.price_monthly)[0] ?? null
  }, [orderedPlans, currentPlan])

  const formatPrice = (amount: number) => {
    if (!Number.isFinite(amount)) return '€0'
    const hasFraction = Math.abs(amount % 1) > 0
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: hasFraction ? 2 : 0,
      maximumFractionDigits: hasFraction ? 2 : 0
    }).format(amount)
  }

  const handleUpgrade = async (planId: string) => {
    try {
      const result = await upgradePlan.mutateAsync(planId)
      // In a real implementation, redirect to checkout
      console.log('Redirecting to checkout:', result.checkoutUrl)
    } catch (error) {
      console.error('Upgrade failed:', error)
    }
  }

  if (isLoadingAccount || isLoadingPlans) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
            <div className="grid gap-6 md:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-96 bg-gray-200 animate-pulse rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Billing & Plans</h1>
              <p className="text-gray-600">Manage your subscription and usage</p>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <ArrowLeftIcon className="h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <SettingsIcon className="h-4 w-4" />
                  Account Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center">
              <TrendingUpIcon className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="plans" className="flex items-center">
              <CrownIcon className="w-4 h-4 mr-2" />
              Plans
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center">
              <CreditCardIcon className="w-4 h-4 mr-2" />
              Billing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-slate-200 p-2">
                    <CrownIcon className="h-5 w-5 text-slate-700" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Current plan</CardTitle>
                    <CardDescription>Stay on top of your subscription details</CardDescription>
                  </div>
                  <Badge variant={currentPlan?.name === 'Free' ? 'secondary' : 'default'} className="ml-auto">
                    {currentPlan?.name}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-slate-900">
                    ${currentPlan?.price_monthly || 0}
                    <span className="text-base font-normal text-gray-600">/month</span>
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-green-500" />
                      {currentPlan?.max_projects === -1 ? 'Unlimited projects' : `${currentPlan?.max_projects} projects`}
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-green-500" />
                      {currentPlan?.max_forms_per_project === -1 ? 'Unlimited forms/project' : `${currentPlan?.max_forms_per_project} forms/project`}
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-green-500" />
                      {currentPlan?.max_responses_per_month === -1 ? 'Unlimited responses/month' : `${currentPlan?.max_responses_per_month.toLocaleString()} responses/month`}
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    if (currentPlan?.name === 'Free' && nextPlanForUpgrade) {
                      handleUpgrade(nextPlanForUpgrade.id)
                    }
                  }}
                  variant={currentPlan?.name === 'Free' ? 'default' : 'outline'}
                  className={currentPlan?.name === 'Free' ? 'bg-orange-600 hover:bg-orange-700 sm:w-auto' : 'sm:w-auto'}
                  disabled={upgradePlan.isPending || (currentPlan?.name === 'Free' && !nextPlanForUpgrade)}
                >
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  {currentPlan?.name === 'Free' ? 'Upgrade plan' : 'Manage plan'}
                </Button>
              </CardContent>
            </Card>

            {planLimits && (
              <Card className="border border-slate-200 shadow-sm">
                <CardContent className="px-6 pb-6 pt-8">
                  <UsageMeter
                    usage={planLimits}
                    planName={currentPlan?.name || 'Free'}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="plans" className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">Compare plans</CardTitle>
                <CardDescription>Pick the plan that fits your current workload.</CardDescription>
              </div>
              <div className="flex items-center space-x-3 rounded-full border border-slate-200 px-3 py-1.5 text-sm">
                <span className={!isYearly ? 'font-semibold text-slate-900' : 'text-slate-500'}>Monthly</span>
                <Switch checked={isYearly} onCheckedChange={setIsYearly} className="scale-90" />
                <span className={isYearly ? 'font-semibold text-slate-900' : 'text-slate-500'}>
                  Yearly
                  <Badge variant="secondary" className="ml-2 text-xs">Save 20%</Badge>
                </span>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {orderedPlans.map((plan) => {
                const isCurrentPlan = plan.id === currentPlan?.id
                const price = isYearly ? plan.price_yearly : plan.price_monthly
                const yearlyDiscount = plan.price_yearly < (plan.price_monthly * 12)

                return (
                  <Card
                    key={plan.id}
                    className={`relative ${
                      plan.name === 'Starter' ? 'border-2 border-orange-200 shadow-lg' : ''
                    } ${isCurrentPlan ? 'ring-2 ring-blue-200' : ''}`}
                  >
                    {plan.name === 'Starter' && (
                      <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-orange-600">
                        Most Popular
                      </Badge>
                    )}
                    {isCurrentPlan && (
                      <Badge className="absolute -top-3 right-4 bg-blue-600">
                        Current Plan
                      </Badge>
                    )}

                    <CardHeader className="text-center">
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <div className="text-3xl font-bold">
                        {formatPrice(price)}
                        <span className="text-sm font-normal text-gray-600">
                          /{isYearly ? 'year' : 'month'}
                        </span>
                      </div>
                      {isYearly && yearlyDiscount && (
                        <p className="text-sm text-green-600">
                          Save {formatPrice((plan.price_monthly * 12) - plan.price_yearly)}/year
                        </p>
                      )}
                      <CardDescription>
                        {plan.name === 'Free' && 'Perfect for trying out the platform.'}
                        {plan.name === 'Starter' && 'Everything you need to launch your first projects.'}
                        {plan.name === 'Professional' && 'Enough feedback capability for multiple projects.'}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center">
                          <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                          {plan.max_projects === -1
                            ? 'Unlimited projects'
                            : `${plan.max_projects} project${plan.max_projects === 1 ? '' : 's'}`}
                        </li>
                        <li className="flex items-center">
                          <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                          {plan.max_forms_per_project === -1
                            ? 'Unlimited forms per project'
                            : `${plan.max_forms_per_project} forms per project`}
                        </li>
                        <li className="flex items-center">
                          <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                          {plan.max_responses_per_month === -1
                            ? 'Unlimited responses per month'
                            : `${plan.max_responses_per_month.toLocaleString()} responses per month`}
                        </li>
                      </ul>

                      <div className="border-t border-slate-200 pt-4">
                        <p className="text-sm font-semibold text-slate-700 mb-3">
                          Included in every plan
                        </p>
                        <ul className="space-y-2 text-sm">
                          {UNIVERSAL_FEATURES.map((feature) => (
                            <li key={feature} className="flex items-center">
                              <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-2">
                        {isCurrentPlan ? (
                          <Button disabled className="w-full">
                            Current Plan
                          </Button>
                        ) : plan.name === 'Free' ? (
                          <Button variant="outline" disabled className="w-full">
                            Downgrade (Contact Support)
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleUpgrade(plan.id)}
                            disabled={upgradePlan.isPending}
                            className={`w-full ${
                              plan.name === 'Starter'
                                ? 'bg-orange-600 hover:bg-orange-700'
                                : ''
                            }`}
                          >
                            {upgradePlan.isPending ? 'Processing...' : `Upgrade to ${plan.name}`}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                You can upgrade or downgrade your plan at any time. Changes will be prorated
                and reflected in your next billing cycle.
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCardIcon className="h-5 w-5 mr-2" />
                  Billing Information
                </CardTitle>
                <CardDescription>
                  Manage your payment methods and billing history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <CreditCardIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Billing Integration Coming Soon</h3>
                  <p className="text-gray-600 mb-4">
                    Payment processing and billing management will be available in a future update.
                  </p>
                  <p className="text-sm text-gray-500">
                    For now, all plans are available for testing purposes.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
