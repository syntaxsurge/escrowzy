import { NextRequest, NextResponse } from 'next/server'

import { getServerSession } from '@/lib/auth/session'
import {
  getPartnershipByEmail,
  getPartnerCommissions
} from '@/lib/db/queries/partnerships'
import { findUserById } from '@/lib/db/queries/users'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = await findUserById(session.user.id)
    if (!user?.email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 404 }
      )
    }

    const partnership = await getPartnershipByEmail(user.email)

    if (!partnership || partnership.status !== 'active') {
      return NextResponse.json(
        { error: 'No active partnership found' },
        { status: 403 }
      )
    }

    const searchParams = req.nextUrl.searchParams
    const _period = searchParams.get('period') || 'all'
    const status = searchParams.get('status') as
      | 'pending'
      | 'paid'
      | 'cancelled'
      | null

    const commissions = await getPartnerCommissions(
      partnership.id,
      status || undefined
    )

    // Calculate totals
    const totals = {
      pending: 0,
      paid: 0,
      total: 0
    }

    commissions.forEach(commission => {
      const amount = parseFloat(commission.amount)
      if (commission.status === 'pending') {
        totals.pending += amount
      } else if (commission.status === 'paid') {
        totals.paid += amount
      }
      totals.total += amount
    })

    return NextResponse.json({
      commissions,
      totals,
      partnership: {
        id: partnership.id,
        commissionRate: partnership.commissionRate
      }
    })
  } catch (error) {
    console.error('Failed to fetch partner commissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch commissions' },
      { status: 500 }
    )
  }
}
