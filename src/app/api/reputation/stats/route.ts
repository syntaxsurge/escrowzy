import { NextRequest, NextResponse } from 'next/server'

import { getAuthSession } from '@/lib/auth'
import { reputationSyncService } from '@/services/reputation-sync.service'

/**
 * GET /api/reputation/stats
 * Get platform-wide reputation statistics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await reputationSyncService.getReputationStats()

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Error fetching reputation stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reputation statistics' },
      { status: 500 }
    )
  }
}
