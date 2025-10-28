import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          supabaseResponse.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          supabaseResponse.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/projects', '/forms', '/settings']
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  )

  // Public routes that should be accessible without authentication
  const publicPaths = ['/f/', '/api/client-info'] // Form submission routes and API
  const isPublicPath = publicPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  )

  // Auth routes that should redirect if user is already authenticated
  const authPaths = ['/auth/login', '/auth/signup']
  const isAuthPath = authPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  )

  // Allow public routes without authentication
  if (isPublicPath) {
    return supabaseResponse
  }

  // Redirect to login if accessing protected route without session
  if (isProtectedPath && !session) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect to dashboard if accessing auth route with session
  if (isAuthPath && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}