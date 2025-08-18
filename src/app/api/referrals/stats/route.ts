import { NextRequest, NextResponse } from 'next/server'

import { getServerSession } from '@/lib/auth/session'
import {
  getReferralStats,
  getReferralLeaderboard
} from '@/lib/db/queries/referrals'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const searchParams = req.nextUrl.searchParams
    const type = searchParams.get('type') || 'personal'

    if (type === 'leaderboard') {
      const limit = parseInt(searchParams.get('limit') || '10')

      const leaderboard = await getReferralLeaderboard(limit)

      return NextResponse.json(leaderboard)
    } else {
      const stats = await getReferralStats(session.user.id)

      return NextResponse.json(stats)
    }
  } catch (error) {
    console.error('Failed to fetch referral stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch referral stats' },
      { status: 500 }
    )
  }
}
