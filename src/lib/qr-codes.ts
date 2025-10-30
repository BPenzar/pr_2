import { supabase } from '@/lib/supabase-client'

export interface GeneratedQRCode {
  id: string
  shortUrl: string
  fullUrl: string
  formId: string
  locationName?: string
  scanCount: number
}

interface EnsureDefaultOptions {
  locationName?: string
}

/**
 * Ensure the given form has at least one QR code.
 * Creates a default QR via the edge function when none exist yet.
 */
export async function ensureDefaultQRCode(
  formId: string,
  options: EnsureDefaultOptions = {}
): Promise<GeneratedQRCode | null> {
  if (!formId) {
    throw new Error('Form ID is required to ensure a default QR code')
  }

  const locationName = options.locationName ?? 'Default'

  const { data: existing, error: existingError } = await supabase
    .from('qr_codes')
    .select('id')
    .eq('form_id', formId)
    .limit(1)

  if (existingError) {
    throw new Error(existingError.message || 'Failed to check existing QR codes')
  }

  if (existing && existing.length > 0) {
    return null
  }

  const { data, error } = await supabase.functions.invoke('generate-qr-code', {
    body: {
      formId,
      locationName,
    },
  })

  if (error) {
    const message =
      (error as { message?: string })?.message ??
      'Failed to generate default QR code'
    throw new Error(message)
  }

  return data as GeneratedQRCode
}
