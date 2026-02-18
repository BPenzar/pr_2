import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  formId: string
  locationName?: string
}

const SHORT_URL_LENGTH = 8
const SHORT_URL_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
const QR_RATE_LIMIT_REQUESTS = 30
const QR_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const qrRateLimitStore = new Map<string, { count: number; resetTime: number }>()

const checkRateLimit = (identifier: string) => {
  const now = Date.now()
  for (const [key, entry] of qrRateLimitStore.entries()) {
    if (now >= entry.resetTime) {
      qrRateLimitStore.delete(key)
    }
  }
  const current = qrRateLimitStore.get(identifier)

  if (!current || now >= current.resetTime) {
    qrRateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + QR_RATE_LIMIT_WINDOW_MS,
    })
    return {
      success: true,
      remaining: QR_RATE_LIMIT_REQUESTS - 1,
      resetTime: now + QR_RATE_LIMIT_WINDOW_MS,
    }
  }

  if (current.count >= QR_RATE_LIMIT_REQUESTS) {
    return {
      success: false,
      remaining: 0,
      resetTime: current.resetTime,
    }
  }

  current.count++
  return {
    success: true,
    remaining: QR_RATE_LIMIT_REQUESTS - current.count,
    resetTime: current.resetTime,
  }
}

const createRateLimitHeaders = (remaining: number, resetTime: number) => ({
  'X-RateLimit-Remaining': remaining.toString(),
  'X-RateLimit-Reset': resetTime.toString(),
  'X-RateLimit-Reset-After': Math.max(0, Math.ceil((resetTime - Date.now()) / 1000)).toString()
})

function generateShortUrl(length: number = SHORT_URL_LENGTH): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)

  let result = ''
  for (let i = 0; i < length; i++) {
    result += SHORT_URL_CHARS[bytes[i] % SHORT_URL_CHARS.length]
  }
  return result
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
      Deno.env.get('SERVICE_ROLE_KEY') ??
      Deno.env.get('SERVICE_ROLE_SUPABASE_KEY') ??
      ''

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase Edge Function configuration: SUPABASE_URL or service role key')
      return new Response(
        JSON.stringify({ error: 'Edge function misconfigured: missing Supabase credentials' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const authHeader = req.headers.get('Authorization') ?? req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const rateResult = checkRateLimit(`qr:${user.id}`)
    if (!rateResult.success) {
      return new Response(
        JSON.stringify({ error: 'Too many QR code requests. Please try again later.' }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            ...createRateLimitHeaders(rateResult.remaining, rateResult.resetTime),
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // Get the request body
    const { formId, locationName }: RequestBody = await req.json()

    if (!formId) {
      return new Response(
        JSON.stringify({ error: 'Form ID is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify the caller owns the form (prevents token-less public abuse)
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (accountError || !account) {
      return new Response(
        JSON.stringify({ error: 'Account not found' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { data: form, error: formError } = await supabase
      .from('forms')
      .select(`
        id,
        name,
        project:projects(
          id,
          account_id
        )
      `)
      .eq('id', formId)
      .single()

    if (formError || !form) {
      return new Response(
        JSON.stringify({ error: 'Form not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (form.project?.account_id !== account.id) {
      return new Response(
        JSON.stringify({ error: 'Not authorized to create QR codes for this form' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const locationNameValue =
      typeof locationName === 'string' && locationName.trim()
        ? locationName.trim().slice(0, 120)
        : null

    // Check for unique short URL
    let shortUrl = generateShortUrl()
    let isUnique = false
    let attempts = 0

    while (!isUnique && attempts < 20) {
      const { data: existing } = await supabase
        .from('qr_codes')
        .select('id')
        .eq('short_url', shortUrl)
        .limit(1)

      if (!existing || existing.length === 0) {
        isUnique = true
      } else {
        shortUrl = generateShortUrl()
        attempts++
      }
    }

    if (!isUnique) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate unique short URL' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create full URL
    const baseUrl = Deno.env.get('APP_URL') || 'http://localhost:3000'
    const fullUrl = `${baseUrl}/f/${shortUrl}`

    // Insert QR code record
    const { data: qrCode, error: insertError } = await supabase
      .from('qr_codes')
      .insert({
        form_id: formId,
        short_url: shortUrl,
        full_url: fullUrl,
        location_name: locationNameValue,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to create QR code' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({
        id: qrCode.id,
        shortUrl,
        fullUrl,
        formId,
        locationName,
        scanCount: 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error generating QR code:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
