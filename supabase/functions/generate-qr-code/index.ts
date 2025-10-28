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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

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

    // Verify form exists and user has access
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

    // Generate short URL
    const generateShortUrl = (): string => {
      const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
      let result = ''
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    }

    // Check for unique short URL
    let shortUrl = generateShortUrl()
    let isUnique = false
    let attempts = 0

    while (!isUnique && attempts < 10) {
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
        location_name: locationName,
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