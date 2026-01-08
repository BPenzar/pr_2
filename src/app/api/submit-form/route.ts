import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-admin'
import {
  formSubmissionRateLimit,
  getClientIP,
  createRateLimitHeaders,
  hashIP
} from '@/lib/rate-limit'
import {
  checkForSpam,
  decodeFormLoadToken
} from '@/lib/anti-spam'

type ResponseValue = string | string[]

interface SubmissionRequest {
  formId: string
  qrCodeId?: string
  locationName?: string
  responses: Record<string, ResponseValue>
  // Anti-spam fields
  honeypotValue?: string
  formLoadToken?: string
  captchaToken?: string
  userAgent?: string
  referrer?: string
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isValidResponseValue(value: unknown): value is ResponseValue {
  if (typeof value === 'string') return true
  if (Array.isArray(value)) {
    return value.every((entry) => typeof entry === 'string')
  }
  return false
}

function hasNonEmptyResponse(value: ResponseValue): boolean {
  if (Array.isArray(value)) {
    return value.some((entry) => entry.trim() !== '')
  }
  return value.trim() !== ''
}

export async function POST(request: NextRequest) {
  try {
    const body: SubmissionRequest = await request.json()
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request payload', type: 'INVALID_REQUEST' },
        { status: 400 }
      )
    }

    const formId = typeof body.formId === 'string' ? body.formId.trim() : ''
    if (!formId) {
      return NextResponse.json(
        { error: 'Missing form identifier', type: 'INVALID_REQUEST' },
        { status: 400 }
      )
    }

    if (!isPlainObject(body.responses)) {
      return NextResponse.json(
        { error: 'Invalid responses payload', type: 'INVALID_REQUEST' },
        { status: 400 }
      )
    }

    const responses = body.responses as Record<string, ResponseValue>
    const responseEntries = Object.entries(responses)
    if (responseEntries.length === 0) {
      return NextResponse.json(
        { error: 'Responses cannot be empty', type: 'INVALID_REQUEST' },
        { status: 400 }
      )
    }

    for (const [questionId, value] of responseEntries) {
      if (!questionId || typeof questionId !== 'string' || !isValidResponseValue(value)) {
        return NextResponse.json(
          { error: 'Invalid response entry', type: 'INVALID_REQUEST' },
          { status: 400 }
        )
      }
    }

    const clientIP = getClientIP(request)
    const hashedIP = hashIP(clientIP)

    // Rate limiting check
    const rateLimitResult = await formSubmissionRateLimit.check(clientIP)

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Too many submissions. Please try again later.',
          type: 'RATE_LIMIT_EXCEEDED'
        },
        {
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult)
        }
      )
    }

    // Anti-spam checks
    const formLoadTime = body.formLoadToken ? decodeFormLoadToken(body.formLoadToken) || undefined : undefined
    const spamCheck = checkForSpam({
      honeypotValue: body.honeypotValue,
      userAgent: body.userAgent || request.headers.get('user-agent') || '',
      referrer: body.referrer || request.headers.get('referer') || '',
      submissionTime: Date.now(),
      formLoadTime: formLoadTime,
      responses: responseEntries.map(([, value]) => ({
        value: Array.isArray(value) ? value.join(' ') : value
      }))
    })

    if (spamCheck.isSpam) {
      console.warn('Spam submission detected:', {
        ip: hashedIP,
        reasons: spamCheck.reasons,
        score: spamCheck.score
      })

      return NextResponse.json(
        {
          error: 'Submission failed validation. Please try again.',
          type: 'SPAM_DETECTED'
        },
        { status: 400 }
      )
    }

    const requiresCaptcha = spamCheck.score >= 20

    if (requiresCaptcha) {
      if (!body.captchaToken) {
        return NextResponse.json(
          {
            error: 'Verification required. Please try again.',
            type: 'CAPTCHA_REQUIRED'
          },
          { status: 400 }
        )
      }

      const captchaVerification = await verifyTurnstileToken(body.captchaToken, clientIP)

      if (!captchaVerification.success) {
        if (captchaVerification.reason === 'missing_secret') {
          return NextResponse.json(
            {
              error: 'CAPTCHA is not configured. Please contact support.',
              type: 'CAPTCHA_NOT_CONFIGURED'
            },
            { status: 500 }
          )
        }

        return NextResponse.json(
          {
            error: 'CAPTCHA verification failed. Please try again.',
            type: 'CAPTCHA_FAILED'
          },
          { status: 400 }
        )
      }
    }

    // Validate form exists and is active
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select(`
        id,
        name,
        is_active,
        project:projects(
          id,
          account_id
        )
      `)
      .eq('id', formId)
      .single()

    if (formError) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      )
    }

    if (!form.is_active) {
      return NextResponse.json(
        { error: 'This form is no longer active' },
        { status: 400 }
      )
    }

    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, required')
      .eq('form_id', formId)

    if (questionsError) {
      console.error('Error loading form questions:', questionsError)
      return NextResponse.json(
        { error: 'Failed to validate submission' },
        { status: 500 }
      )
    }

    const questionIdSet = new Set((questions ?? []).map((question) => question.id))
    const unknownQuestion = responseEntries.find(([questionId]) => !questionIdSet.has(questionId))

    if (unknownQuestion) {
      return NextResponse.json(
        { error: 'Submission includes unknown questions', type: 'INVALID_QUESTION' },
        { status: 400 }
      )
    }

    const missingRequired = (questions ?? [])
      .filter((question) => question.required)
      .filter((question) => {
        const value = responses[question.id]
        if (!value) return true
        return !hasNonEmptyResponse(value)
      })

    if (missingRequired.length > 0) {
      return NextResponse.json(
        { error: 'Required questions are missing responses', type: 'MISSING_REQUIRED_QUESTION' },
        { status: 400 }
      )
    }

    // Check if form can accept more responses (plan limits)
    const { data: canAccept, error: limitError } = await supabase
      .rpc('can_accept_response', { form_uuid: formId })

    if (limitError) {
      console.error('Error checking response limits:', limitError)
      return NextResponse.json(
        { error: 'Failed to validate submission' },
        { status: 500 }
      )
    }

    if (!canAccept) {
      return NextResponse.json(
        {
          error: 'This form has reached its response limit',
          type: 'LIMIT_EXCEEDED'
        },
        { status: 400 }
      )
    }

    // Create response record
    const userAgentHash = body.userAgent ?
      createHash('sha256').update(body.userAgent).digest('hex') :
      null

    const { data: response, error: responseError } = await supabase
      .from('responses')
      .insert({
        form_id: formId,
        qr_code_id: body.qrCodeId,
        ip_hash: hashedIP,
        location_name: body.locationName,
        user_agent_hash: userAgentHash,
      })
      .select()
      .single()

    if (responseError) {
      console.error('Error creating response:', responseError)
      return NextResponse.json(
        { error: 'Failed to save response' },
        { status: 500 }
      )
    }

    // Create response items
    const responseItems = responseEntries.map(([questionId, value]) => ({
      response_id: response.id,
      question_id: questionId,
      value: Array.isArray(value) ? JSON.stringify(value) : String(value),
    }))

    const { error: itemsError } = await supabase
      .from('response_items')
      .insert(responseItems)

    if (itemsError) {
      console.error('Error creating response items:', itemsError)
      const { error: cleanupError } = await supabase
        .from('responses')
        .delete()
        .eq('id', response.id)
      if (cleanupError) {
        console.error('Failed to cleanup response after item error:', cleanupError)
      }
      return NextResponse.json(
        { error: 'Failed to save response details' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        responseId: response.id
      },
      {
        headers: createRateLimitHeaders(rateLimitResult)
      }
    )

  } catch (error) {
    console.error('Form submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function verifyTurnstileToken(token: string, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY

  if (!secret) {
    console.error('Missing TURNSTILE_SECRET_KEY')
    return { success: false, reason: 'missing_secret' as const }
  }

  try {
    const params = new URLSearchParams({
      secret,
      response: token,
      remoteip: ip
    })

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: params
    })

    if (!response.ok) {
      console.error('Turnstile verification failed with status:', response.status)
      return { success: false, reason: 'request_failed' as const }
    }

    const data = await response.json()
    if (data?.success) {
      return { success: true }
    }
    return { success: false, reason: 'invalid' as const }
  } catch (error) {
    console.error('Turnstile verification error:', error)
    return { success: false, reason: 'request_failed' as const }
  }
}
