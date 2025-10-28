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
  decodeFormLoadToken,
  verifyCaptcha
} from '@/lib/anti-spam'

interface SubmissionRequest {
  formId: string
  qrCodeId?: string
  locationName?: string
  responses: Record<string, string | string[]>
  // Anti-spam fields
  honeypotValue?: string
  formLoadToken?: string
  captchaQuestion?: string
  captchaAnswer?: string
  userAgent?: string
  referrer?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: SubmissionRequest = await request.json()
    const clientIP = getClientIP(request)
    const hashedIP = hashIP(clientIP)

    // Rate limiting check
    const rateLimitResult = formSubmissionRateLimit.check(clientIP)

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
      responses: Object.values(body.responses).map(value => ({
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

    // Verify CAPTCHA if provided
    if (body.captchaQuestion && body.captchaAnswer) {
      // Extract expected answer from question (simple implementation)
      const expectedAnswer = extractCaptchaAnswer(body.captchaQuestion)
      if (!verifyCaptcha(expectedAnswer, body.captchaAnswer)) {
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
      .eq('id', body.formId)
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

    // Check if form can accept more responses (plan limits)
    const { data: canAccept, error: limitError } = await supabase
      .rpc('can_accept_response', { form_uuid: body.formId })

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
      Buffer.from(body.userAgent).toString('base64').slice(0, 64) :
      null

    const { data: response, error: responseError } = await supabase
      .from('responses')
      .insert({
        form_id: body.formId,
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
    const responseItems = Object.entries(body.responses).map(([questionId, value]) => ({
      response_id: response.id,
      question_id: questionId,
      value: Array.isArray(value) ? JSON.stringify(value) : String(value),
    }))

    const { error: itemsError } = await supabase
      .from('response_items')
      .insert(responseItems)

    if (itemsError) {
      console.error('Error creating response items:', itemsError)
      return NextResponse.json(
        { error: 'Failed to save response details' },
        { status: 500 }
      )
    }

    // Log successful submission (for monitoring)
    console.log('Form submission successful:', {
      formId: body.formId,
      responseId: response.id,
      hashedIP,
      spamScore: spamCheck.score
    })

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

/**
 * Extract expected answer from CAPTCHA question
 */
function extractCaptchaAnswer(question: string): string {
  // Simple math questions
  if (question.includes('2 + 3')) return '5'
  if (question.includes('4 + 6')) return '10'
  if (question.includes('7 - 2')) return '5'
  if (question.includes('8 - 3')) return '5'
  if (question.includes('3 × 2')) return '6'
  if (question.includes('4 × 3')) return '12'

  // Simple knowledge questions
  if (question.includes('color is the sky')) return 'blue'
  if (question.includes('days are in a week')) return '7'

  return ''
}