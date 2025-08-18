import { NextRequest, NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db/drizzle'
import { users } from '@/lib/db/schema'
import { reputationSyncService } from '@/services/reputation-sync.service'

const querySchema = z.object({
  userId: z.string().optional()
})

/**
 * GET /api/reputation/verify
 * Verify reputation integrity for a user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const params = querySchema.parse({
      userId: searchParams.get('userId') || undefined
    })

    const userId = params.userId ? parseInt(params.userId, 10) : session.user.id

    // Only allow verifying own reputation or admin can verify any
    if (userId !== session.user.id) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1)

      if (!user || user.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const result = await reputationSyncService.verifyReputationIntegrity(userId)

    return NextResponse.json({
      success: true,
      data: {
        userId,
        isValid: result.isValid,
        issues: result.issues
      }
    })
  } catch (error) {
    console.error('Error verifying reputation:', error)
    return NextResponse.json(
      { error: 'Failed to verify reputation' },
      { status: 500 }
    )
  }
}
