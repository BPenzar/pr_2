'use client'

import { useMemo } from 'react'
import { useResponses } from '@/hooks/use-responses'
import { useForm } from '@/hooks/use-forms'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatDistanceToNow } from 'date-fns'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import type { PieLabelRenderProps } from 'recharts'
import { getOptionColorConfig } from '@/lib/option-colors'
import { normalizeChoiceOptions } from '@/lib/question-utils'
import type { OptionColorKey } from '@/lib/option-colors'

interface ResponseAnalyticsProps {
  formId: string
}

type RatingSummary = {
  questionId: string
  questionTitle: string
  scale: number
  total: number
  average: number
  distribution: Array<{ value: number; count: number }>
}

type ChoiceSummary = {
  questionId: string
  questionTitle: string
  counts: Array<{ option: string; count: number; color?: OptionColorKey }>
}

type TextSummary = {
  questionId: string
  questionTitle: string
  responses: Array<{ value: string; submittedAt: string }>
}

export function ResponseAnalytics({ formId }: ResponseAnalyticsProps) {
  const { data: responses, isLoading, error } = useResponses(formId)
  const { data: form, isLoading: formLoading } = useForm(formId)

  const summaries = useMemo(() => {
    const ratingSummaries: RatingSummary[] = []
    const choiceSummaries: ChoiceSummary[] = []
    const textSummaries: TextSummary[] = []

    if (!responses || !form) {
      return {
        ratingSummaries,
        choiceSummaries,
        textSummaries,
        totalResponses: 0,
        latestResponse: null,
        overallAverageRating: null,
      }
    }

    const totalResponses = responses.length
    const latestResponse = responses[0]?.submitted_at ?? null

    const questionMap = new Map<string, any>()
    form.questions?.forEach((question: any) => {
      questionMap.set(question.id, {
        ...question,
        options: normalizeChoiceOptions(question.options),
      })
    })

    const ratingAccumulator = new Map<string, number[]>()
    const choiceAccumulator = new Map<string, Record<string, number>>()
    const textAccumulator = new Map<string, Array<{ value: string; submittedAt: string }>>()

    for (const response of responses) {
      response.response_items.forEach((item: any) => {
        const question = questionMap.get(item.question_id) || item.questions
        if (!question) return

        if (question.type === 'rating') {
          const numeric = Number(item.value)
          if (!Number.isFinite(numeric)) return
          const arr = ratingAccumulator.get(question.id) ?? []
          arr.push(numeric)
          ratingAccumulator.set(question.id, arr)
        } else if (question.type === 'choice') {
          const option = item.value
          const counts = choiceAccumulator.get(question.id) ?? {}
          counts[option] = (counts[option] ?? 0) + 1
          choiceAccumulator.set(question.id, counts)
        } else if (question.type === 'multiselect') {
          try {
            const selections: string[] = JSON.parse(item.value)
            const counts = choiceAccumulator.get(question.id) ?? {}
            selections.forEach((selection) => {
              counts[selection] = (counts[selection] ?? 0) + 1
            })
            choiceAccumulator.set(question.id, counts)
          } catch {
            // ignore malformed payloads
          }
        } else if (question.type === 'text' || question.type === 'textarea') {
          if (!item.value) return
          const entries = textAccumulator.get(question.id) ?? []
          entries.push({ value: item.value, submittedAt: response.submitted_at })
          textAccumulator.set(question.id, entries)
        }
      })
    }

    let overallRatingSum = 0
    let overallRatingCount = 0

    ratingAccumulator.forEach((values, questionId) => {
      const question = questionMap.get(questionId)
      if (!question) return

      const total = values.length
      if (!total) return

      const scale = typeof question.rating_scale === 'number' ? question.rating_scale : 10
      const sum = values.reduce((acc, value) => acc + value, 0)
      const average = sum / total
      overallRatingSum += sum
      overallRatingCount += total

      const distribution: Array<{ value: number; count: number }> = []
      for (let value = 1; value <= scale; value += 1) {
        const count = values.filter((entry) => entry === value).length
        distribution.push({ value, count })
      }

      ratingSummaries.push({
        questionId,
        questionTitle: question.title,
        scale,
        total,
        average,
        distribution,
      })
    })

    choiceAccumulator.forEach((counts, questionId) => {
      const question = questionMap.get(questionId)
      if (!question) return

      const optionDefinitions = normalizeChoiceOptions(question.options)
      const seen = new Set<string>()

      const orderedEntries = optionDefinitions
        .map((option) => ({
          option: option.label,
          count: counts[option.label] ?? 0,
          color: option.color,
        }))
        .filter((entry) => {
          if (!entry.count) return false
          seen.add(entry.option)
          return true
        })

      const extraEntries = Object.entries(counts)
        .filter(([option]) => !seen.has(option))
        .map(([option, count]) => ({ option, count, color: undefined as OptionColorKey | undefined }))
        .sort((a, b) => b.count - a.count)

      const combinedEntries = [...orderedEntries, ...extraEntries]
      if (!combinedEntries.length) return

      choiceSummaries.push({
        questionId,
        questionTitle: question.title,
        counts: combinedEntries,
      })
    })

    textAccumulator.forEach((entries, questionId) => {
      const question = questionMap.get(questionId)
      if (!question) return
      textSummaries.push({
        questionId,
        questionTitle: question.title,
        responses: entries.sort((a, b) => (a.submittedAt > b.submittedAt ? -1 : 1)),
      })
    })

    const overallAverageRating = overallRatingCount > 0 ? overallRatingSum / overallRatingCount : null

    return {
      ratingSummaries,
      choiceSummaries,
      textSummaries,
      totalResponses,
      latestResponse,
      overallAverageRating,
    }
  }, [responses, form])

  if (isLoading || formLoading) {
    return (
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="h-6 w-48 rounded bg-gray-200 animate-pulse" />
          <div className="h-4 w-full rounded bg-gray-200 animate-pulse" />
          <div className="h-4 w-full rounded bg-gray-200 animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load response analytics: {error.message}
        </AlertDescription>
      </Alert>
    )
  }

  if (!form) {
    return (
      <Alert>
        <AlertDescription>Form not found.</AlertDescription>
      </Alert>
    )
  }

  const {
    ratingSummaries,
    choiceSummaries,
    textSummaries,
    totalResponses,
    latestResponse,
    overallAverageRating,
  } = summaries

  const PALETTE = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ef4444', '#06b6d4', '#facc15', '#ec4899']

  const ratingColor = (value: number, scale: number) => {
    const normalized = Math.max(0, Math.min(scale, value))

    if (scale <= 5) {
      if (normalized <= 2) return '#ef4444'
      if (normalized <= 3) return '#f97316'
      if (normalized <= 4) return '#facc15'
      return '#10b981'
    }

    if (normalized <= 6) return '#ef4444'
    if (normalized <= 8) return '#facc15'
    if (normalized <= 9) return '#10b981'
    return '#047857'
  }

  const hexToRgba = (hex: string, alpha: number) => {
    const normalized = hex.replace('#', '')
    if (normalized.length !== 6) return hex
    const r = parseInt(normalized.slice(0, 2), 16)
    const g = parseInt(normalized.slice(2, 4), 16)
    const b = parseInt(normalized.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  const RADIAN = Math.PI / 180
  const renderChoiceLabel = (summaryIndex: number, counts: ChoiceSummary['counts']) => {
    const ChoiceLabel = ({ cx, cy, midAngle, outerRadius, percent, index }: PieLabelRenderProps) => {
      if (!percent || index == null) return null
      const fallbackRadius = typeof outerRadius === 'number' ? outerRadius : 110
      const radius = fallbackRadius + 12
      const x = cx + radius * Math.cos(-midAngle * RADIAN)
      const y = cy + radius * Math.sin(-midAngle * RADIAN)
      const isRight = x > cx
      const textAnchor = isRight ? 'end' : 'start'
      const offset = isRight ? -6 : 6
      const entry = counts[index]
      const fallback = PALETTE[(summaryIndex * 4 + index) % PALETTE.length]
      const fillColor = entry?.color ? getOptionColorConfig(entry.color).hex : fallback

      return (
        <text
          x={x + offset}
          y={y}
          fill={fillColor}
          textAnchor={textAnchor}
          dominantBaseline="central"
          fontSize={14}
          fontWeight={600}
        >
          {`${Math.round(percent * 100)}%`}
        </text>
      )
    }

    ChoiceLabel.displayName = 'ChoiceLabel'
    return ChoiceLabel
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Total Responses</CardTitle>
          <CardDescription>Total submissions collected for this form</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">{totalResponses}</div>
          {latestResponse && (
            <p className="text-xs text-muted-foreground">
              Last response {formatDistanceToNow(new Date(latestResponse), { addSuffix: true })}
            </p>
          )}
        </CardContent>
      </Card>

      {ratingSummaries.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Rating Breakdown</h2>
          <div className="grid gap-6">
            {ratingSummaries.map((summary, index) => {
              const averageColor = ratingColor(summary.average, summary.scale)
              const averageBackground = hexToRgba(averageColor, 0.15)

              return (
              <Card key={summary.questionId}>
                <CardHeader>
                  <CardTitle>{summary.questionTitle}</CardTitle>
                  <CardDescription>Based on {summary.total} responses · Scale {summary.scale}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-center">
                    <div className="relative mx-auto h-72 w-72 max-w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={summary.distribution.map(({ value, count }) => ({
                              name: `Score ${value}`,
                              value: count,
                            }))}
                            cx="50%"
                            cy="50%"
                            outerRadius={110}
                            innerRadius={70}
                            dataKey="value"
                          >
                            {summary.distribution.map(({ value }) => (
                              <Cell key={value} fill={ratingColor(value, summary.scale)} />
                            ))}
                          </Pie>
                      <Tooltip formatter={(value: number, label: string) => [value, label]} />
                        </PieChart>
                      </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div
                        className="flex h-20 w-20 flex-col items-center justify-center rounded-full border shadow-inner"
                        style={{
                          backgroundColor: averageBackground,
                          borderColor: averageColor,
                          color: averageColor,
                        }}
                      >
                        <span className="text-xl font-semibold">{summary.average.toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">avg</span>
                      </div>
                    </div>
                    </div>
                    <div className="flex-1 space-y-3">
                      {summary.distribution.map(({ value, count }, distIndex) => (
                        <div key={value} className="flex items-center gap-4 text-sm text-gray-700">
                          <span
                            className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: ratingColor(value, summary.scale) }}
                          >
                            {value}
                          </span>
                          <Progress
                            value={summary.total ? (count / summary.total) * 100 : 0}
                            className="flex-1"
                          />
                          <span className="w-12 text-right text-muted-foreground">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )})}
          </div>
        </div>
      )}

      {choiceSummaries.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Choice Distribution</h2>
          <div className="grid gap-6">
            {choiceSummaries.map((summary, summaryIndex) => (
              <Card key={summary.questionId}>
                <CardHeader>
                  <CardTitle>{summary.questionTitle}</CardTitle>
                  <CardDescription>Selections across all responses</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-center">
                    <div className="mx-auto h-72 w-72 max-w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={summary.counts}
                            dataKey="count"
                            nameKey="option"
                            cx="50%"
                            cy="50%"
                            outerRadius={110}
                            innerRadius={70}
                            labelLine={false}
                            label={renderChoiceLabel(summaryIndex, summary.counts)}
                          >
                            {summary.counts.map((entry, optionIndex) => {
                              const fallback = PALETTE[(summaryIndex * 4 + optionIndex) % PALETTE.length]
                              const fillColor = entry.color
                                ? getOptionColorConfig(entry.color).hex
                                : fallback
                              return <Cell key={entry.option} fill={fillColor} />
                            })}
                          </Pie>
                          <Tooltip formatter={(value: number, name: string) => [value, name]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-3">
                      {summary.counts.map(({ option, count, color }, optionIndex) => {
                        const fallback = PALETTE[(summaryIndex * 4 + optionIndex) % PALETTE.length]
                        const chipClasses = color
                          ? `${getOptionColorConfig(color).chip} border border-transparent`
                          : 'bg-slate-500 text-white border border-slate-500'
                        return (
                          <div key={option} className="flex items-center gap-4 text-sm text-gray-700">
                            <span
                              className={`flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-2 text-xs font-semibold ${chipClasses}`}
                              style={{ backgroundColor: color ? undefined : fallback, color: color ? undefined : 'white' }}
                            >
                              {optionIndex + 1}
                            </span>
                            <span className="flex-1">{option}</span>
                            <span className="w-12 text-right text-muted-foreground">{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {textSummaries.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Open Feedback</h2>
          <div className="space-y-4">
            {textSummaries.map((summary) => (
              <Card key={summary.questionId}>
                <CardHeader>
                  <CardTitle>{summary.questionTitle}</CardTitle>
                  <CardDescription>Latest responses (up to 10)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {summary.responses.slice(0, 10).map((entry, index) => (
                    <div key={index} className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                      <p>{entry.value}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(entry.submittedAt), { addSuffix: true })}
                      </p>
                    </div>
                  ))}
                  {summary.responses.length > 10 && (
                    <p className="text-xs text-muted-foreground">
                      Showing latest 10 of {summary.responses.length} responses.
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {totalResponses === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Responses will appear here once submissions start coming in.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
