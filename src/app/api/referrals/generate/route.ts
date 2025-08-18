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

    const body = await req.json()
    const { campaignSource, customSlug } = body

    const referralLink = await generateReferralLink(
      session.user.id,
      campaignSource,
      customSlug
    )

    if (!referralLink) {
      return NextResponse.json(
        { error: 'Failed to generate referral link' },
        { status: 500 }
      )
    }

    // Construct the full URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://escrowzy.com'
    const fullUrl = `${baseUrl}/ref/${referralLink.code}`

    return NextResponse.json({
      link: referralLink,
      code: referralLink.code,
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
