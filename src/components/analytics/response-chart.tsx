'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { format, parseISO, subDays, eachDayOfInterval } from 'date-fns'

interface ResponseChartProps {
  data: Array<{
    response_date: string
    responses_count: number
  }>
  title?: string
  description?: string
}

export function ResponseChart({ data, title = "Responses Over Time", description }: ResponseChartProps) {
  // Fill in missing days with 0 responses for last 30 days
  const chartData = useMemo(() => {
    const endDate = new Date()
    const startDate = subDays(endDate, 29) // Last 30 days

    const allDays = eachDayOfInterval({ start: startDate, end: endDate })

    return allDays.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd')
      const existingData = data.find(d => d.response_date === dateStr)

      return {
        date: dateStr,
        responses: existingData?.responses_count || 0,
        formattedDate: format(day, 'MMM dd'),
      }
    })
  }, [data])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="formattedDate"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis />
              <Tooltip
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    const data = payload[0].payload
                    return format(parseISO(data.date), 'MMMM dd, yyyy')
                  }
                  return label
                }}
                formatter={(value: number) => [value, 'Responses']}
              />
              <Line
                type="monotone"
                dataKey="responses"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

interface QRPerformanceChartProps {
  data: Array<{
    id: string
    location_name?: string
    scan_count: number
  }>
}

export function QRPerformanceChart({ data }: QRPerformanceChartProps) {
  const chartData = data.map(qr => ({
    name: qr.location_name || `QR ${qr.id.slice(-4)}`,
    scans: qr.scan_count,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>QR Code Performance</CardTitle>
        <CardDescription>Scans by location/QR code</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip formatter={(value: number) => [value, 'Scans']} />
              <Bar dataKey="scans" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

interface LocationAnalyticsProps {
  data: Array<{
    location: string
    count: number
  }>
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export function LocationAnalytics({ data }: LocationAnalyticsProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Response Locations</CardTitle>
          <CardDescription>Where your responses are coming from</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            No location data available
          </div>
        </CardContent>
      </Card>
    )
  }

  const total = data.reduce((sum, item) => sum + item.count, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Response Locations</CardTitle>
        <CardDescription>Where your responses are coming from</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row items-center">
          <div className="h-[250px] w-full lg:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ location, percent }) =>
                    `${location} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, 'Responses']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full lg:w-1/2 lg:pl-6">
            <div className="space-y-2">
              {data.map((item, index) => (
                <div key={item.location} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm">{item.location}</span>
                  </div>
                  <div className="text-sm font-medium">
                    {item.count} ({Math.round((item.count / total) * 100)}%)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}