import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'

export async function GET(request: NextRequest) {
  try {
    // Get client IP address
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const ip = forwarded?.split(',')[0] || realIP || 'unknown'

    // Hash the IP for GDPR compliance
    const ipHash = createHash('sha256').update(ip).digest('hex')

    return NextResponse.json({
      ipHash,
    })
  } catch (error) {
    console.error('Error getting client info:', error)
    return NextResponse.json(
      { error: 'Failed to get client info' },
      { status: 500 }
    )
  }
}