import { NextRequest, NextResponse } from 'next/server'

import { getServerSession } from '@/lib/auth/session'
import {
  getPartnershipByUserId,
  getPartnershipStats
} from '@/lib/db/queries/partnerships'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const partnership = await getPartnershipByUserId(session.user.id)

    if (!partnership) {
      return NextResponse.json({
        hasPartnership: false,
        message: 'No active partnership found'
      })
    }

    // Get partnership stats if active
    let stats = null
    if (partnership.status === 'active') {
      stats = await getPartnershipStats(partnership.id)
    }

    return NextResponse.json({
      hasPartnership: true,
      partnership,
      stats
    })
  } catch (error) {
    console.error('Failed to fetch partnership status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch partnership status' },
      { status: 500 }
    )
  }
}
