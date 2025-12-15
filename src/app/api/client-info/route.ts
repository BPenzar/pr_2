import { NextRequest, NextResponse } from 'next/server'
import { getClientIP, hashIP } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    const ipHash = hashIP(getClientIP(request))

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
