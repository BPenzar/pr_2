import { describe, expect, it, vi } from 'vitest'
import {
  checkForSpam,
  createFormLoadToken,
  validateSubmissionToken,
} from '@/lib/anti-spam'

describe('anti-spam helpers', () => {
  it('flags honeypot submissions as spam', () => {
    const result = checkForSpam({
      honeypotValue: 'bot',
      userAgent: 'Mozilla/5.0',
      formLoadTime: 0,
      submissionTime: 5000,
    })

    expect(result.isSpam).toBe(true)
    expect(result.reasons).toContain('Honeypot field filled')
    expect(result.score).toBeGreaterThanOrEqual(50)
  })

  it('allows normal submissions', () => {
    const result = checkForSpam({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      formLoadTime: 0,
      submissionTime: 5000,
      responses: [{ value: 'Great service and quick response.' }],
    })

    expect(result.isSpam).toBe(false)
    expect(result.reasons).toHaveLength(0)
    expect(result.score).toBe(0)
  })

  it('validates submission tokens within max age', () => {
    vi.useFakeTimers()
    const baseTime = new Date('2025-01-01T00:00:00Z')
    vi.setSystemTime(baseTime)

    const token = createFormLoadToken()

    vi.setSystemTime(new Date(baseTime.getTime() + 1000))
    expect(validateSubmissionToken(token, 2000)).toBe(true)

    vi.setSystemTime(new Date(baseTime.getTime() + 3000))
    expect(validateSubmissionToken(token, 2000)).toBe(false)

    vi.useRealTimers()
  })
})
