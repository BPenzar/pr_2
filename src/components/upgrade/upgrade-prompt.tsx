'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CrownIcon,
  ZapIcon,
  CheckIcon,
  XIcon,
  ArrowRightIcon,
  SparklesIcon
} from 'lucide-react'

interface UpgradePromptProps {
  feature: string
  currentLimit: number
  upgradeLimit: number
  onUpgrade?: () => void
  onDismiss?: () => void
  variant?: 'card' | 'inline' | 'modal'
}

const PLAN_FEATURES = {
  free: {
    name: 'Free Plan',
    price: '$0',
    period: 'forever',
    features: [
      '3 projects',
      '10 forms per project',
      '100 responses per month',
      '5 QR codes per form',
      'Basic analytics',
      'CSV export'
    ],
    limitations: [
      'Limited customization',
      'BSP branding',
      'Email support only'
    ]
  },
  pro: {
    name: 'Pro Plan',
    price: '$19',
    period: 'month',
    features: [
      'Unlimited projects',
      'Unlimited forms',
      '10,000 responses per month',
      'Unlimited QR codes',
      'Advanced analytics',
      'Custom branding',
      'Priority support',
      'API access',
      'Team collaboration',
      'Advanced integrations'
    ],
    popular: true
  },
  enterprise: {
    name: 'Enterprise',
    price: 'Custom',
    period: 'pricing',
    features: [
      'Everything in Pro',
      'Unlimited responses',
      'White-label solution',
      'SSO integration',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee',
      'Advanced security'
    ]
  }
}

export function UpgradePrompt({
  feature,
  currentLimit,
  upgradeLimit,
  onUpgrade,
  onDismiss,
  variant = 'card'
}: UpgradePromptProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (variant === 'inline') {
    return (
      <Alert className="border-orange-200 bg-orange-50">
        <CrownIcon className="h-4 w-4 text-orange-600" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-orange-800">
            You&apos;ve reached your {feature} limit ({currentLimit}).
            <strong> Upgrade to Pro</strong> for {upgradeLimit === -1 ? 'unlimited' : upgradeLimit} {feature}.
          </span>
          <div className="flex space-x-2">
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="h-6 px-2 text-orange-600 hover:text-orange-700"
              >
                <XIcon className="h-3 w-3" />
              </Button>
            )}
            <Button
              size="sm"
              onClick={onUpgrade}
              className="h-6 px-3 bg-orange-600 hover:bg-orange-700"
            >
              Upgrade
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <CrownIcon className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-orange-900">
                Upgrade to Pro
              </CardTitle>
              <CardDescription className="text-orange-700">
                You&apos;ve reached your {feature} limit
              </CardDescription>
            </div>
          </div>
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="text-orange-600 hover:text-orange-700"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="p-3 bg-white rounded-lg border border-orange-200">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Current limit</span>
            <span className="font-medium text-orange-600">{currentLimit}</span>
          </div>
          <div className="flex justify-between items-center text-sm mt-1">
            <span className="text-gray-600">Pro limit</span>
            <span className="font-medium text-green-600">
              {upgradeLimit === -1 ? 'Unlimited' : upgradeLimit}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">
              Starting at <span className="font-semibold text-gray-900">$19/month</span>
            </p>
            <p className="text-xs text-gray-500">
              Cancel anytime • 14-day free trial
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              {isExpanded ? 'Hide Details' : 'See Plans'}
            </Button>
            <Button
              onClick={onUpgrade}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <SparklesIcon className="h-4 w-4 mr-2" />
              Upgrade Now
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-4 border-t border-orange-200 pt-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Free Plan */}
              <div className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">
                    {PLAN_FEATURES.free.name}
                  </h4>
                  <Badge variant="secondary">Current</Badge>
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-3">
                  {PLAN_FEATURES.free.price}
                  <span className="text-sm font-normal text-gray-600">
                    /{PLAN_FEATURES.free.period}
                  </span>
                </p>
                <ul className="space-y-2 text-sm">
                  {PLAN_FEATURES.free.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                  {PLAN_FEATURES.free.limitations.map((limitation, index) => (
                    <li key={index} className="flex items-center text-gray-500">
                      <XIcon className="h-4 w-4 text-red-400 mr-2 flex-shrink-0" />
                      {limitation}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pro Plan */}
              <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg border border-orange-300 relative">
                {PLAN_FEATURES.pro.popular && (
                  <Badge className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900">
                    Most Popular
                  </Badge>
                )}
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{PLAN_FEATURES.pro.name}</h4>
                  <ZapIcon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-bold mb-3">
                  {PLAN_FEATURES.pro.price}
                  <span className="text-sm font-normal opacity-90">
                    /{PLAN_FEATURES.pro.period}
                  </span>
                </p>
                <ul className="space-y-2 text-sm">
                  {PLAN_FEATURES.pro.features.slice(0, 6).map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                  <li className="text-xs opacity-90">
                    + {PLAN_FEATURES.pro.features.length - 6} more features
                  </li>
                </ul>
                <Button
                  className="w-full mt-4 bg-white text-orange-600 hover:bg-gray-100"
                  onClick={onUpgrade}
                >
                  Start Free Trial
                  <ArrowRightIcon className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}