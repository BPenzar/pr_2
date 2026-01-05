import { describe, expect, it, vi } from 'vitest'
import { createRateLimitHeaders, getClientIP, hashIP } from '@/lib/rate-limit'

describe('rate limit helpers', () => {
  it('extracts the first forwarded IP address', () => {
    const request = new Request('http://localhost', {
      headers: {
        'x-forwarded-for': '1.2.3.4, 5.6.7.8',
      },
    })

    expect(getClientIP(request)).toBe('1.2.3.4')
  })

  it('builds rate limit headers based on reset time', () => {
    vi.useFakeTimers()
    const now = new Date('2025-01-01T00:00:00Z')
    vi.setSystemTime(now)

    const headers = createRateLimitHeaders({
      remaining: 7,
      resetTime: now.getTime() + 30_000,
    })

    expect(headers['X-RateLimit-Remaining']).toBe('7')
    expect(headers['X-RateLimit-Reset-After']).toBe('30')

    vi.useRealTimers()
  })

  it('hashes IPs consistently with the same salt', () => {
    const previousSalt = process.env.IP_HASH_SALT
    process.env.IP_HASH_SALT = 'test-salt'

    const first = hashIP('203.0.113.1')
    const second = hashIP('203.0.113.1')

    expect(first).toBe(second)

    if (previousSalt === undefined) {
      delete process.env.IP_HASH_SALT
    } else {
      process.env.IP_HASH_SALT = previousSalt
    }
  })
})
