import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PATHS = ['/dashboard', '/projects', '/forms', '/settings']
const PUBLIC_PATHS = ['/f/', '/api/client-info']
const AUTH_PATHS = ['/auth/login', '/auth/signup']

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const hasSession =
    Boolean(request.cookies.get('sb-access-token')?.value) ||
    Boolean(request.cookies.get('sb-refresh-token')?.value)

  const isProtectedPath = PROTECTED_PATHS.some((path) =>
    pathname.startsWith(path)
  )
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path))
  const isAuthPath = AUTH_PATHS.some((path) => pathname.startsWith(path))

  if (isPublicPath) {
    return NextResponse.next()
  }

  if (isProtectedPath && !hasSession) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (isAuthPath && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
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
