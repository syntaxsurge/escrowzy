import { NextRequest, NextResponse } from 'next/server'

import {
  trackReferralClick,
  createReferralConversion
} from '@/lib/db/queries/referrals'

export async function POST(req: NextRequest) {
  try {
    const { code, action, referredUserId } = await req.json()

    if (!code || !action) {
      return NextResponse.json(
        { error: 'Invalid tracking data' },
        { status: 400 }
      )
    }

    let result

    if (action === 'click') {
      // Track click event
      result = await trackReferralClick(code)
    } else if (action === 'conversion' && referredUserId) {
      // Track conversion event
      result = await createReferralConversion(code, referredUserId)
    } else {
      return NextResponse.json(
        { error: 'Invalid action type' },
        { status: 400 }
      )
    }

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to track referral' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: `Referral ${action} tracked successfully`
    })
  } catch (error) {
    console.error('Failed to track referral:', error)
    return NextResponse.json(
      { error: 'Failed to track referral' },
      { status: 500 }
    )
  }
}
