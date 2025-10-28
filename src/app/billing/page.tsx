'use client'

import { useState } from 'react'
import { useAccountPlan, usePlans, useUpgradePlan, usePlanLimits } from '@/hooks/use-plans'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UsageMeter } from '@/components/upgrade/usage-meter'
import {
  CrownIcon,
  CheckIcon,
  ZapIcon,
  SparklesIcon,
  CreditCardIcon,
  CalendarIcon,
  TrendingUpIcon,
  InfoIcon
} from 'lucide-react'
import Link from 'next/link'

export default function BillingPage() {
  const { data: accountData, isLoading: isLoadingAccount } = useAccountPlan()
  const { data: plans, isLoading: isLoadingPlans } = usePlans()
  const planLimits = usePlanLimits()
  const upgradePlan = useUpgradePlan()
  const [isYearly, setIsYearly] = useState(false)

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

  const currentPlan = accountData?.plan
  const usage = planLimits ? {
    projects: planLimits.projects,
    forms: planLimits.forms,
    responses: planLimits.responses,
    qrCodes: planLimits.qrCodes
  } : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Billing & Plans</h1>
              <p className="text-gray-600">Manage your subscription and usage</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  Back to Dashboard
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
            {/* Current Plan */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center">
                      <CrownIcon className="h-5 w-5 mr-2" />
                      Current Plan
                    </CardTitle>
                    <CardDescription>
                      Your active subscription and features
                    </CardDescription>
                  </div>
                  <Badge variant={currentPlan?.name === 'Free' ? 'secondary' : 'default'}>
                    {currentPlan?.name}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-2xl font-bold">
                      ${currentPlan?.price_monthly || 0}
                      <span className="text-sm font-normal text-gray-600">/month</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      {currentPlan?.name === 'Free' ? 'No payment required' : 'Billed monthly'}
                    </p>
                  </div>
                  {currentPlan?.name === 'Free' && (
                    <Button onClick={() => handleUpgrade('pro')} className="bg-orange-600 hover:bg-orange-700">
                      <SparklesIcon className="h-4 w-4 mr-2" />
                      Upgrade to Pro
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Usage Overview */}
            {usage && (
              <UsageMeter
                usage={usage}
                planName={currentPlan?.name || 'Free'}
                onUpgrade={() => handleUpgrade('pro')}
                showUpgradePrompts={true}
              />
            )}
          </TabsContent>

          <TabsContent value="plans" className="space-y-6">
            {/* Billing Toggle */}
            <div className="flex justify-center">
              <div className="flex items-center space-x-4 p-1 bg-gray-100 rounded-lg">
                <span className={`text-sm ${!isYearly ? 'font-medium' : 'text-gray-600'}`}>
                  Monthly
                </span>
                <Switch
                  checked={isYearly}
                  onCheckedChange={setIsYearly}
                />
                <span className={`text-sm ${isYearly ? 'font-medium' : 'text-gray-600'}`}>
                  Yearly
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Save 20%
                  </Badge>
                </span>
              </div>
            </div>

            {/* Plan Cards */}
            <div className="grid gap-6 lg:grid-cols-3">
              {plans?.map((plan) => {
                const isCurrentPlan = plan.id === currentPlan?.id
                const price = isYearly ? plan.price_yearly : plan.price_monthly
                const yearlyDiscount = plan.price_yearly < (plan.price_monthly * 12)

                return (
                  <Card
                    key={plan.id}
                    className={`relative ${
                      plan.name === 'Pro' ? 'border-2 border-orange-200 shadow-lg' : ''
                    } ${isCurrentPlan ? 'ring-2 ring-blue-200' : ''}`}
                  >
                    {plan.name === 'Pro' && (
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
                        ${price}
                        <span className="text-sm font-normal text-gray-600">
                          /{isYearly ? 'year' : 'month'}
                        </span>
                      </div>
                      {isYearly && yearlyDiscount && (
                        <p className="text-sm text-green-600">
                          Save ${(plan.price_monthly * 12) - plan.price_yearly}/year
                        </p>
                      )}
                      <CardDescription>
                        {plan.name === 'Free' && 'Perfect for getting started'}
                        {plan.name === 'Pro' && 'For growing businesses'}
                        {plan.name === 'Enterprise' && 'For large organizations'}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <ul className="space-y-2 text-sm">
                        {/* Limits */}
                        <li className="flex items-center">
                          <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                          {plan.max_projects === -1 ? 'Unlimited' : plan.max_projects} projects
                        </li>
                        <li className="flex items-center">
                          <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                          {plan.max_forms_per_project === -1 ? 'Unlimited' : plan.max_forms_per_project} forms per project
                        </li>
                        <li className="flex items-center">
                          <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                          {plan.max_responses_per_month === -1 ? 'Unlimited' : plan.max_responses_per_month.toLocaleString()} responses/month
                        </li>
                        <li className="flex items-center">
                          <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                          {plan.max_qr_codes_per_form === -1 ? 'Unlimited' : plan.max_qr_codes_per_form} QR codes per form
                        </li>

                        {/* Features */}
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <div className="pt-4">
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
                              plan.name === 'Pro'
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