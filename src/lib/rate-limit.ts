import { createHash } from 'crypto'

interface RateLimitEntry {
  count: number
  resetTime: number
}

interface RateLimitConfig {
  requests: number
  window: number // in milliseconds
}

// In-memory store for rate limiting (in production, use Redis or similar)
const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * Rate limiting implementation using sliding window
 */
export class RateLimit {
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  /**
   * Check if a request should be allowed based on rate limiting
   */
  check(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now()
    const key = this.createKey(identifier)

    // Clean up expired entries periodically
    this.cleanup()

    const entry = rateLimitStore.get(key)

    if (!entry) {
      // First request for this identifier
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

    // Check if window has expired
    if (now >= entry.resetTime) {
      // Reset the window
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

    // Window is still active
    if (entry.count >= this.config.requests) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime
      }
    }

    // Increment counter
    entry.count++

    return {
      allowed: true,
      remaining: this.config.requests - entry.count,
      resetTime: entry.resetTime
    }
  }

  private createKey(identifier: string): string {
    return `rate_limit:${createHash('sha256').update(identifier).digest('hex')}`
  }

  private cleanup(): void {
    const now = Date.now()

    for (const [key, entry] of rateLimitStore.entries()) {
      if (now >= entry.resetTime) {
        rateLimitStore.delete(key)
      }
    }
  }
}

/**
 * Create a rate limiter for form submissions
 * Allows 10 submissions per 15 minutes per IP
 */
export const formSubmissionRateLimit = new RateLimit({
  requests: 10,
  window: 15 * 60 * 1000 // 15 minutes
})

/**
 * Create a rate limiter for general API requests
 * Allows 100 requests per 10 minutes per IP
 */
export const apiRateLimit = new RateLimit({
  requests: 100,
  window: 10 * 60 * 1000 // 10 minutes
})

/**
 * Create a strict rate limiter for authentication
 * Allows 5 attempts per 5 minutes per IP
 */
export const authRateLimit = new RateLimit({
  requests: 5,
  window: 5 * 60 * 1000 // 5 minutes
})

/**
 * Get client IP address from request headers
 */
export function getClientIP(request: Request): string {
  // Try to get real IP from various headers (for proxies/load balancers)
  const headers = request.headers

  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    // Take the first IP if there are multiple
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

  // Fallback to a default if we can't determine IP
  return 'unknown'
}

/**
 * Create rate limit response headers
 */
export function createRateLimitHeaders(result: { remaining: number; resetTime: number }) {
  return {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetTime.toString(),
    'X-RateLimit-Reset-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
  }
}

/**
 * Hash IP address for privacy compliance
 */
export function hashIP(ip: string): string {
  return createHash('sha256').update(ip + process.env.IP_HASH_SALT || 'default-salt').digest('hex')
}