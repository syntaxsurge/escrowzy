import { NextRequest, NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'

import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db/drizzle'
import { users } from '@/lib/db/schema'
import { reputationSyncService } from '@/services/reputation-sync.service'

/**
 * POST /api/reputation/decay
 * Apply reputation decay to inactive users (admin only)
 */
export async function POST(_request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden. Admin access required.' },
        { status: 403 }
      )
    }

    const result = await reputationSyncService.applyReputationDecay()

    return NextResponse.json({
      data: {
        affectedUsers: result.affectedUsers,
        totalDecayApplied: result.totalDecayApplied,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error applying reputation decay:', error)
    return NextResponse.json(
      { error: 'Failed to apply reputation decay' },
      { status: 500 }
    )
  }
}
