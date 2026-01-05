import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { LEGAL_VERSION } from '@/lib/legal'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const providerError = requestUrl.searchParams.get('error')
  const providerErrorDescription = requestUrl.searchParams.get('error_description')
  const redirectPath = requestUrl.searchParams.get('redirectTo')
  const safeRedirectPath =
    redirectPath && redirectPath.startsWith('/') ? redirectPath : '/dashboard'

  if (providerError) {
    const fallbackUrl = new URL('/auth/login', request.url)
    fallbackUrl.searchParams.set('error', providerError)
    if (providerErrorDescription) {
      fallbackUrl.searchParams.set('error_description', providerErrorDescription)
    }
    return NextResponse.redirect(fallbackUrl)
  }

  if (!code) {
    const fallbackUrl = new URL('/auth/login', request.url)
    fallbackUrl.searchParams.set('error', 'oauth_missing_code')
    return NextResponse.redirect(fallbackUrl)
  }

  let response = NextResponse.redirect(new URL(safeRedirectPath, request.url))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('OAuth code exchange failed:', error)
    const fallbackUrl = new URL('/auth/login', request.url)
    fallbackUrl.searchParams.set('error', 'oauth_exchange_failed')
    return NextResponse.redirect(fallbackUrl)
  }

  const userMetadata = data?.user?.user_metadata ?? {}
  const hasAcceptedLegal =
    userMetadata.legal_version === LEGAL_VERSION &&
    userMetadata.terms_accepted_at &&
    userMetadata.privacy_accepted_at

  if (!hasAcceptedLegal) {
    const acceptUrl = new URL('/auth/accept-terms', request.url)
    acceptUrl.searchParams.set('redirectTo', safeRedirectPath)
    response.headers.set('Location', acceptUrl.toString())
  }

  return response
}
