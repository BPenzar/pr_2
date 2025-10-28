import { createHash } from 'crypto'

/**
 * Anti-spam configuration
 */
export interface AntiSpamConfig {
  honeypotFieldName: string
  minSubmissionTime: number // minimum time to fill form (in milliseconds)
  maxSubmissionTime: number // maximum reasonable time (in milliseconds)
  suspiciousUserAgents: string[]
  blockedReferrers: string[]
}

/**
 * Default anti-spam configuration
 */
export const defaultAntiSpamConfig: AntiSpamConfig = {
  honeypotFieldName: 'email_confirm', // Hidden field that bots might fill
  minSubmissionTime: 3000, // 3 seconds minimum
  maxSubmissionTime: 30 * 60 * 1000, // 30 minutes maximum
  suspiciousUserAgents: [
    'bot',
    'crawler',
    'spider',
    'scraper',
    'automated',
    'headless',
    'phantom',
    'selenium'
  ],
  blockedReferrers: [
    'spam',
    'casino',
    'viagra',
    'porn'
  ]
}

/**
 * Submission validation result
 */
export interface SpamCheckResult {
  isSpam: boolean
  reasons: string[]
  score: number // 0-100, higher = more likely spam
}

/**
 * Check submission for spam indicators
 */
export function checkForSpam(
  data: {
    honeypotValue?: string
    userAgent?: string
    referrer?: string
    submissionTime?: number
    formLoadTime?: number
    responses?: Array<{ value: string }>
  },
  config: AntiSpamConfig = defaultAntiSpamConfig
): SpamCheckResult {
  const reasons: string[] = []
  let score = 0

  // Check honeypot field
  if (data.honeypotValue && data.honeypotValue.trim() !== '') {
    reasons.push('Honeypot field filled')
    score += 90 // Very high spam indicator
  }

  // Check submission timing
  if (data.formLoadTime && data.submissionTime) {
    const timeTaken = data.submissionTime - data.formLoadTime

    if (timeTaken < config.minSubmissionTime) {
      reasons.push('Form submitted too quickly')
      score += 60
    }

    if (timeTaken > config.maxSubmissionTime) {
      reasons.push('Form submission timeout')
      score += 30
    }
  }

  // Check user agent
  if (data.userAgent) {
    const userAgentLower = data.userAgent.toLowerCase()

    for (const suspicious of config.suspiciousUserAgents) {
      if (userAgentLower.includes(suspicious)) {
        reasons.push(`Suspicious user agent: ${suspicious}`)
        score += 40
        break
      }
    }

    // Empty or very short user agent
    if (data.userAgent.length < 10) {
      reasons.push('Suspicious user agent length')
      score += 30
    }
  }

  // Check referrer
  if (data.referrer) {
    const referrerLower = data.referrer.toLowerCase()

    for (const blocked of config.blockedReferrers) {
      if (referrerLower.includes(blocked)) {
        reasons.push(`Blocked referrer: ${blocked}`)
        score += 70
        break
      }
    }
  }

  // Check response content for spam patterns
  if (data.responses) {
    const spamPatterns = [
      /http[s]?:\/\//gi, // URLs
      /www\./gi, // Website references
      /\b(?:casino|viagra|cialis|porn|xxx|sex|gambling|loan|bitcoin|crypto)\b/gi,
      /(.)\1{10,}/gi, // Repeated characters
      /[A-Z]{10,}/g, // All caps
    ]

    for (const response of data.responses) {
      if (!response.value) continue

      for (const pattern of spamPatterns) {
        const matches = response.value.match(pattern)
        if (matches && matches.length > 0) {
          reasons.push('Spam content detected')
          score += 20 * matches.length
          break
        }
      }

      // Check for excessive length
      if (response.value.length > 1000) {
        reasons.push('Excessive response length')
        score += 15
      }
    }
  }

  // Cap the score at 100
  score = Math.min(score, 100)

  return {
    isSpam: score >= 50, // Threshold for spam detection
    reasons,
    score
  }
}

/**
 * Generate honeypot field configuration
 */
export function generateHoneypotField(formId: string) {
  const hash = createHash('md5').update(formId + Date.now()).digest('hex').substring(0, 8)

  return {
    name: `email_${hash}`,
    label: 'Please leave this field empty',
    placeholder: '',
    tabIndex: -1,
    autoComplete: 'off'
  }
}

/**
 * Create form load timestamp token
 */
export function createFormLoadToken(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2)
  return btoa(`${timestamp}:${random}`)
}

/**
 * Decode form load timestamp from token
 */
export function decodeFormLoadToken(token: string): number | null {
  try {
    const decoded = atob(token)
    const [timestamp] = decoded.split(':')
    return parseInt(timestamp, 10)
  } catch {
    return null
  }
}

/**
 * Validate form submission token
 */
export function validateSubmissionToken(
  token: string,
  maxAge: number = 30 * 60 * 1000 // 30 minutes
): boolean {
  const loadTime = decodeFormLoadToken(token)
  if (!loadTime) return false

  const now = Date.now()
  const age = now - loadTime

  return age > 0 && age <= maxAge
}

/**
 * Check if IP should be blocked (basic implementation)
 */
export function shouldBlockIP(ip: string): boolean {
  // In a real implementation, this would check against:
  // - Known bot IP ranges
  // - Blacklisted IPs
  // - Geographic restrictions
  // - Cloud provider IPs (if blocking datacenter traffic)

  const blockedRanges = [
    // Example: Block some common bot ranges (this is just an example)
    '127.0.0.1' // Localhost for testing
  ]

  return blockedRanges.includes(ip)
}

/**
 * Simple CAPTCHA challenge (text-based)
 */
export function generateSimpleCaptcha(): { question: string; answer: string } {
  const operations = [
    { question: 'What is 2 + 3?', answer: '5' },
    { question: 'What is 4 + 6?', answer: '10' },
    { question: 'What is 7 - 2?', answer: '5' },
    { question: 'What is 8 - 3?', answer: '5' },
    { question: 'What is 3 × 2?', answer: '6' },
    { question: 'What is 4 × 3?', answer: '12' },
    { question: 'What color is the sky?', answer: 'blue' },
    { question: 'How many days are in a week?', answer: '7' }
  ]

  const selected = operations[Math.floor(Math.random() * operations.length)]
  return selected
}

/**
 * Verify CAPTCHA answer
 */
export function verifyCaptcha(expected: string, provided: string): boolean {
  return expected.toLowerCase().trim() === provided.toLowerCase().trim()
}