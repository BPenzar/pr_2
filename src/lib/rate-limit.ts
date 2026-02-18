import { createHash } from 'crypto'

interface RateLimitEntry {
  count: number
  resetTime: number
}

interface RateLimitConfig {
  requests: number
  window: number // in milliseconds
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
}

export interface RateLimiter {
  check: (identifier: string) => Promise<RateLimitResult>
}

const rateLimitStore = new Map<string, RateLimitEntry>()
let warnedMissingIPHashSalt = false

class InMemoryRateLimiter implements RateLimiter {
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  async check(identifier: string): Promise<RateLimitResult> {
    const now = Date.now()
    const key = createKey(identifier)

    cleanupExpired(now)

    const entry = rateLimitStore.get(key)

    if (!entry) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + this.config.window
      })

      return {
        allowed: true,
        remaining: this.config.requests - 1,
        resetTime: now + this.config.window
      }
    }

    if (now >= entry.resetTime) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + this.config.window
      })

      return {
        allowed: true,
        remaining: this.config.requests - 1,
        resetTime: now + this.config.window
      }
    }

    if (entry.count >= this.config.requests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime
      }
    }

    entry.count++

    return {
      allowed: true,
      remaining: this.config.requests - entry.count,
      resetTime: entry.resetTime
    }
  }
}

function createRateLimiter(config: RateLimitConfig): RateLimiter {
  return new InMemoryRateLimiter(config)
}

function createKey(identifier: string): string {
  return `rate_limit:${createHash('sha256').update(identifier).digest('hex')}`
}

function cleanupExpired(now: number): void {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

/**
 * Create a rate limiter for form submissions
 * Allows 10 submissions per 15 minutes per IP
 */
export const formSubmissionRateLimit = createRateLimiter({
  requests: 10,
  window: 15 * 60 * 1000 // 15 minutes
})

/**
 * Create a rate limiter for general API requests
 * Allows 100 requests per 10 minutes per IP
 */
export const apiRateLimit = createRateLimiter({
  requests: 100,
  window: 10 * 60 * 1000 // 10 minutes
})

/**
 * Create a strict rate limiter for authentication
 * Allows 5 attempts per 5 minutes per IP
 */
export const authRateLimit = createRateLimiter({
  requests: 5,
  window: 5 * 60 * 1000 // 5 minutes
})

/**
 * Get client IP address from request headers
 */
export function getClientIP(request: Request): string {
  const headers = request.headers

  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIP = headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  const clientIP = headers.get('x-client-ip')
  if (clientIP) {
    return clientIP
  }

  return 'unknown'
}

/**
 * Create rate limit response headers
 */
export function createRateLimitHeaders(result: { remaining: number; resetTime: number }) {
  return {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetTime.toString(),
    'X-RateLimit-Reset-After': Math.max(0, Math.ceil((result.resetTime - Date.now()) / 1000)).toString()
  }
}

/**
 * Hash IP address for privacy compliance
 */
export function hashIP(ip: string): string {
  const salt = process.env.IP_HASH_SALT

  if (!salt && !warnedMissingIPHashSalt) {
    warnedMissingIPHashSalt = true
    console.warn(
      'Missing env.IP_HASH_SALT; IP hashes will be less private. Set IP_HASH_SALT to a strong random value.'
    )
  }

  return createHash('sha256')
    .update(`${ip}${salt ?? 'default-salt'}`)
    .digest('hex')
}
