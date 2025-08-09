import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { appRoutes } from '@/config/app-routes'
import { signToken, verifyToken } from '@/lib/auth/session'
import { validateSession, extendSession } from '@/lib/db/queries/sessions'

const protectedRoutes = [
  appRoutes.dashboard.base,
  appRoutes.chat.base,
  appRoutes.trades.base,
  appRoutes.battles.base,
  appRoutes.battleArena,
  appRoutes.rewards.base,
  appRoutes.admin.base
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = request.cookies.get('session')
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )

  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL(appRoutes.home, request.url))
  }

  let res = NextResponse.next()

  if (sessionCookie) {
    try {
      const parsed = await verifyToken(sessionCookie.value)

      // Validate session exists in database
      const dbSession = await validateSession(parsed.sessionToken)

      if (!dbSession) {
        // Session doesn't exist in database or expired
        res.cookies.delete('session')
        if (isProtectedRoute) {
          return NextResponse.redirect(new URL(appRoutes.home, request.url))
        }
      } else if (request.method === 'GET') {
        // Extend session on GET requests
        await extendSession(parsed.sessionToken)
        const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000)

        // Only use secure cookies in production
        const isProduction = process.env.NODE_ENV === 'production'

        res.cookies.set({
          name: 'session',
          value: await signToken({
            ...parsed,
            expires: expiresInOneDay.toISOString()
          }),
          httpOnly: true,
          secure: isProduction,
          sameSite: 'lax',
          expires: expiresInOneDay
        })
      }
    } catch (error) {
      console.error('Error validating session:', error)
      res.cookies.delete('session')
      if (isProtectedRoute) {
        return NextResponse.redirect(new URL(appRoutes.home, request.url))
      }
    }
  }

  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
  runtime: 'nodejs'
}
