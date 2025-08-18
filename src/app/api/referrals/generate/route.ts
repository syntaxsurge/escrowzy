import { NextRequest, NextResponse } from 'next/server'

import { getServerSession } from '@/lib/auth/session'
import { generateReferralLink } from '@/lib/db/queries/referrals'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const referralLink = await generateReferralLink(session.user.id)

    if (!referralLink) {
      return NextResponse.json(
        { error: 'Failed to generate referral link' },
        { status: 500 }
      )
    }

    // Construct the full URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://escrowzy.com'
    const fullUrl = `${baseUrl}/ref/${referralLink}`

    return NextResponse.json({
      code: referralLink,
      fullUrl,
      message: 'Referral link generated successfully'
    })
  } catch (error) {
    console.error('Failed to generate referral link:', error)
    return NextResponse.json(
      { error: 'Failed to generate referral link' },
      { status: 500 }
    )
  }
}
