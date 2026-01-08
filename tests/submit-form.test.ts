import { createHash } from 'crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/submit-form/route'

const supabaseMock = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
}))

const formSubmissionRateLimit = vi.hoisted(() => ({
  check: vi.fn(),
}))

const checkForSpam = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase-admin', () => ({
  supabase: supabaseMock,
}))

vi.mock('@/lib/rate-limit', async () => {
  const actual = await vi.importActual<typeof import('@/lib/rate-limit')>('@/lib/rate-limit')
  return {
    ...actual,
    formSubmissionRateLimit,
  }
})

vi.mock('@/lib/anti-spam', async () => {
  const actual = await vi.importActual<typeof import('@/lib/anti-spam')>('@/lib/anti-spam')
  return {
    ...actual,
    checkForSpam,
  }
})

const baseRequest = (body: Record<string, unknown>) =>
  new Request('http://localhost/api/submit-form', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '203.0.113.10',
    },
    body: JSON.stringify(body),
  })

type QuestionRecord = {
  id: string
  required?: boolean | null
}

function setupSupabaseMocks(options: {
  formRecord?: {
    id: string
    name: string
    is_active: boolean
    project: { id: string; account_id: string }
  }
  questions?: QuestionRecord[]
  canAccept?: boolean
  responseId?: string
  responseItemsError?: { message?: string } | null
} = {}) {
  const {
    formRecord = {
      id: 'form-1',
      name: 'Test Form',
      is_active: true,
      project: { id: 'project-1', account_id: 'account-1' },
    },
    questions = [{ id: 'question-1', required: true }],
    canAccept = true,
    responseId = 'response-1',
    responseItemsError = null,
  } = options

  const formsQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: formRecord, error: null }),
  }

  const questionsQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ data: questions, error: null }),
  }

  const responsesQuery = {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { id: responseId }, error: null }),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ error: null }),
  }

  const responseItemsQuery = {
    insert: vi.fn().mockResolvedValue({ error: responseItemsError }),
  }

  supabaseMock.from.mockImplementation((table: string) => {
    if (table === 'forms') return formsQuery
    if (table === 'questions') return questionsQuery
    if (table === 'responses') return responsesQuery
    if (table === 'response_items') return responseItemsQuery
    return formsQuery
  })

  supabaseMock.rpc.mockResolvedValue({ data: canAccept, error: null })

  return {
    formsQuery,
    questionsQuery,
    responsesQuery,
    responseItemsQuery,
  }
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('submit form API', () => {
  it('accepts a valid submission', async () => {
    formSubmissionRateLimit.check.mockResolvedValue({
      allowed: true,
      remaining: 9,
      resetTime: Date.now() + 60_000,
    })

    checkForSpam.mockReturnValue({
      isSpam: false,
      reasons: [],
      score: 0,
    })

    const { responsesQuery } = setupSupabaseMocks({
      questions: [{ id: 'question-1', required: true }],
    })

    const response = await POST(
      baseRequest({
        formId: 'form-1',
        responses: {
          'question-1': 'Great service',
        },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      }) as unknown as Parameters<typeof POST>[0]
    )

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.success).toBe(true)
    expect(json.responseId).toBe('response-1')
    const expectedHash = createHash('sha256')
      .update('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')
      .digest('hex')
    expect(responsesQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_agent_hash: expectedHash,
      })
    )
  })

  it('returns 429 when rate limited', async () => {
    formSubmissionRateLimit.check.mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetTime: Date.now() + 60_000,
    })

    const response = await POST(
      baseRequest({
        formId: 'form-1',
        responses: {
          'question-1': 'Great service',
        },
      }) as unknown as Parameters<typeof POST>[0]
    )

    expect(response.status).toBe(429)
    const json = await response.json()
    expect(json.type).toBe('RATE_LIMIT_EXCEEDED')
  })

  it('rejects spam submissions', async () => {
    formSubmissionRateLimit.check.mockResolvedValue({
      allowed: true,
      remaining: 9,
      resetTime: Date.now() + 60_000,
    })

    checkForSpam.mockReturnValue({
      isSpam: true,
      reasons: ['Honeypot field filled'],
      score: 90,
    })

    const response = await POST(
      baseRequest({
        formId: 'form-1',
        responses: {
          'question-1': 'Spam response',
        },
        honeypotValue: 'bot',
      }) as unknown as Parameters<typeof POST>[0]
    )

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.type).toBe('SPAM_DETECTED')
  })

  it('rejects invalid responses payload', async () => {
    formSubmissionRateLimit.check.mockResolvedValue({
      allowed: true,
      remaining: 9,
      resetTime: Date.now() + 60_000,
    })

    const response = await POST(
      baseRequest({
        formId: 'form-1',
        responses: 'not-an-object',
      }) as unknown as Parameters<typeof POST>[0]
    )

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.type).toBe('INVALID_REQUEST')
    expect(supabaseMock.from).not.toHaveBeenCalled()
    expect(checkForSpam).not.toHaveBeenCalled()
  })

  it('rejects unknown questions', async () => {
    formSubmissionRateLimit.check.mockResolvedValue({
      allowed: true,
      remaining: 9,
      resetTime: Date.now() + 60_000,
    })

    checkForSpam.mockReturnValue({
      isSpam: false,
      reasons: [],
      score: 0,
    })

    const { responsesQuery } = setupSupabaseMocks({
      questions: [{ id: 'question-1', required: false }],
    })

    const response = await POST(
      baseRequest({
        formId: 'form-1',
        responses: {
          'question-unknown': 'Great service',
        },
      }) as unknown as Parameters<typeof POST>[0]
    )

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.type).toBe('INVALID_QUESTION')
    expect(responsesQuery.insert).not.toHaveBeenCalled()
  })

  it('rejects missing required responses', async () => {
    formSubmissionRateLimit.check.mockResolvedValue({
      allowed: true,
      remaining: 9,
      resetTime: Date.now() + 60_000,
    })

    checkForSpam.mockReturnValue({
      isSpam: false,
      reasons: [],
      score: 0,
    })

    const { responsesQuery } = setupSupabaseMocks({
      questions: [
        { id: 'question-1', required: true },
        { id: 'question-2', required: false },
      ],
    })

    const response = await POST(
      baseRequest({
        formId: 'form-1',
        responses: {
          'question-2': 'Optional answer',
        },
      }) as unknown as Parameters<typeof POST>[0]
    )

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.type).toBe('MISSING_REQUIRED_QUESTION')
    expect(responsesQuery.insert).not.toHaveBeenCalled()
  })

  it('cleans up responses when response items fail', async () => {
    formSubmissionRateLimit.check.mockResolvedValue({
      allowed: true,
      remaining: 9,
      resetTime: Date.now() + 60_000,
    })

    checkForSpam.mockReturnValue({
      isSpam: false,
      reasons: [],
      score: 0,
    })

    const { responsesQuery } = setupSupabaseMocks({
      questions: [{ id: 'question-1', required: true }],
      responseItemsError: { message: 'Insert failed' },
    })

    const response = await POST(
      baseRequest({
        formId: 'form-1',
        responses: {
          'question-1': 'Great service',
        },
      }) as unknown as Parameters<typeof POST>[0]
    )

    expect(response.status).toBe(500)
    expect(responsesQuery.delete).toHaveBeenCalled()
    expect(responsesQuery.eq).toHaveBeenCalledWith('id', 'response-1')
  })
})
