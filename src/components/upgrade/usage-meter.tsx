'use client'

import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BarChart3Icon,
  FileTextIcon,
  MessageSquareIcon,
  QrCodeIcon,
  AlertTriangleIcon
} from 'lucide-react'

interface UsageData {
  projects: { current: number; limit: number }
  forms: { current: number; limit: number }
  responses: { current: number; limit: number }
  qrCodes: { current: number; limit: number }
}

interface UsageMeterProps {
  usage: UsageData
  planName: string
}

const USAGE_ICONS = {
  projects: BarChart3Icon,
  forms: FileTextIcon,
  responses: MessageSquareIcon,
  qrCodes: QrCodeIcon
}

const USAGE_LABELS = {
  projects: 'Projects',
  forms: 'Forms',
  responses: 'Responses',
  qrCodes: 'QR Codes'
}

const USAGE_DESCRIPTIONS = {
  projects: 'Active projects in your account',
  forms: 'Total forms across all projects',
  responses: 'Monthly form responses',
  qrCodes: 'Generated QR codes'
}

export function UsageMeter({ usage, planName }: UsageMeterProps) {
  const calculateProgress = (current: number, limit: number) => {
    if (limit === -1) return 0 // Unlimited
    return Math.min((current / limit) * 100, 100)
  }

  const getUsageStatus = (current: number, limit: number) => {
    if (limit === -1) return 'unlimited'
    if (current >= limit) return 'exceeded'
    if (current / limit >= 0.9) return 'warning'
    if (current / limit >= 0.75) return 'high'
    return 'normal'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'exceeded':
        return 'text-red-600'
      case 'warning':
        return 'text-orange-600'
      case 'high':
        return 'text-yellow-600'
      case 'unlimited':
        return 'text-green-600'
      default:
        return 'text-gray-600'
    }
  }

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'exceeded':
        return 'bg-red-500'
      case 'warning':
        return 'bg-orange-500'
      case 'high':
        return 'bg-yellow-500'
      default:
        return 'bg-blue-500'
    }
  }

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'exceeded':
        return 'destructive' as const
      case 'warning':
        return 'secondary' as const
      case 'unlimited':
        return 'default' as const
      default:
        return 'outline' as const
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Usage Overview</h3>
          <p className="text-sm text-slate-500">
            Current usage for your {planName} plan
          </p>
        </div>
        <Badge variant="outline" className="w-fit">
          {planName}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-2">
        {Object.entries(usage).map(([key, { current, limit }]) => {
          const normalizedLimit = typeof limit === 'number' && Number.isFinite(limit) ? limit : -1
          const Icon = USAGE_ICONS[key as keyof typeof USAGE_ICONS]
          const status = getUsageStatus(current, normalizedLimit)
          const progress = calculateProgress(current, normalizedLimit)

          return (
            <Card
              key={key}
              className={`border border-slate-200 shadow-sm transition-shadow hover:shadow-md ${
                status === 'exceeded' ? 'border-red-200' : ''
              }`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-medium">
                      {USAGE_LABELS[key as keyof typeof USAGE_LABELS]}
                    </CardTitle>
                  </div>
                  <Badge variant={getBadgeVariant(status)} className="text-xs">
                    {status === 'unlimited' ? 'Unlimited' :
                     status === 'exceeded' ? 'Exceeded' :
                     status === 'warning' ? 'Near Limit' : 'Good'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className={`text-2xl font-bold ${getStatusColor(status)}`}>
                      {current.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {normalizedLimit === -1 ? '∞' : `/ ${normalizedLimit.toLocaleString()}`}
                  </span>
                </div>

                  {normalizedLimit !== -1 && (
                    <div className="space-y-1">
                      <Progress
                        value={progress}
                        className="h-2"
                        // Custom background color based on status
                        style={{
                          background: status === 'exceeded' ? '#fee2e2' :
                                    status === 'warning' ? '#fef3c7' :
                                    status === 'high' ? '#fefce8' : '#f3f4f6'
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        {USAGE_DESCRIPTIONS[key as keyof typeof USAGE_DESCRIPTIONS]}
                      </p>
                    </div>
                  )}

                  {status === 'exceeded' && (
                    <div className="flex items-center text-xs text-red-600">
                      <AlertTriangleIcon className="h-3 w-3 mr-1" />
                      Limit reached
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
