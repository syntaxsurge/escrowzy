import { NextRequest } from 'next/server'

import { lt, eq } from 'drizzle-orm'

import { envServer } from '@/config/env.server'
import { apiResponses } from '@/lib/api/server-utils'
import { db } from '@/lib/db/drizzle'
import { teamInvitations } from '@/lib/db/schema'

export async function GET(request: NextRequest) {
  try {
    // Optional: Add authentication to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    const cronSecret = envServer.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return apiResponses.unauthorized()
    }

    // Delete expired invitations
    const result = await db
      .delete(teamInvitations)
      .where(lt(teamInvitations.expiresAt, new Date()))
      .returning({ id: teamInvitations.id })

    // Also delete declined invitations (status = 'declined')
    const declinedResult = await db
      .delete(teamInvitations)
      .where(eq(teamInvitations.status, 'declined'))
      .returning({ id: teamInvitations.id })

    return apiResponses.success({
      success: true,
      deletedExpired: result.length,
      deletedDeclined: declinedResult.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return apiResponses.handleError(error, 'Failed to cleanup invitations')
  }
}
