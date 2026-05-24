import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, isAdmin } from '@/lib/auth'

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout']
const ADMIN_PATHS = ['/admin']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next()
  }

  const token = request.cookies.get('ipl_token')?.value
  const payload = token ? verifyToken(token) : null

  if (!payload) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (ADMIN_PATHS.some(p => pathname.startsWith(p))) {
    if (!isAdmin(payload.role)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  const res = NextResponse.next()
  res.headers.set('x-user-id', payload.sub)
  res.headers.set('x-user-role', payload.role)
  res.headers.set('x-user-name', encodeURIComponent(payload.name))
  res.headers.set('x-user-blok', encodeURIComponent(payload.blok))
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
