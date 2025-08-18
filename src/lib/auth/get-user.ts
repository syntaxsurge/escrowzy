import 'server-only'
import { cookies } from 'next/headers'

import { eq } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { validateSession } from '@/lib/db/queries/sessions'
import { users } from '@/lib/db/schema'

import { verifyToken } from './session'

/**
 * Get user for Server Components - read-only, no cookie modification
 * Use this in pages, layouts, and other Server Components
 * For API routes and Server Actions, use getUserForRoute instead
 */
export async function getUser() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')

  if (!sessionCookie || !sessionCookie.value) {
    return null
  }

  let sessionData
  try {
    sessionData = await verifyToken(sessionCookie.value)
  } catch (_error) {
    // Invalid JWT - return null without modifying cookies
    return null
  }

  // Validate session structure
  if (
    !sessionData ||
    !sessionData.user ||
    typeof sessionData.user.id !== 'number' ||
    !sessionData.sessionToken ||
    !sessionData.expires
  ) {
    return null
  }

  // Check JWT expiry
  if (new Date(sessionData.expires) < new Date()) {
    return null
  }

  try {
    // Validate session exists in database and is not expired
    const dbSession = await validateSession(sessionData.sessionToken)
    if (!dbSession) {
      // Session doesn't exist in DB or is expired - return null
      return null
    }

    // Check if user ID matches
    if (dbSession.userId !== sessionData.user.id) {
      return null
    }

    // Get user from database
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, sessionData.user.id))
      .limit(1)

    if (user.length === 0) {
      // User doesn't exist - return null
      return null
    }

    // Return the user data
    return user[0]
  } catch (error) {
    // Database error - fail closed (deny access)
    console.error('Session validation error:', error)
    return null
  }
}
