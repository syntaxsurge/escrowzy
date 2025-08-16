import { NextRequest, NextResponse } from 'next/server'

import { z } from 'zod'

import { getServerSession } from '@/lib/auth'
import { getFreelancerStats } from '@/lib/db/queries/freelancers'
import {
  getUserVerificationBadges,
  getVerificationStatus,
  verifyEmailBadge,
  verifyIdentityBadge,
  verifyProfessionalBadge
} from '@/lib/db/queries/verification-badges'

const verifyIdentitySchema = z.object({
  signature: z.string(),
  message: z.string()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const targetUserId = userId ? parseInt(userId) : session.userId

    if (isNaN(targetUserId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    const [badges, status] = await Promise.all([
      getUserVerificationBadges(targetUserId),
      getVerificationStatus(targetUserId)
    ])

    return NextResponse.json({
      badges,
      status
    })
  } catch (error) {
    console.error('Error fetching verification badges:', error)
    return NextResponse.json(
      { error: 'Failed to fetch verification badges' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type } = body

    let badge = null

    switch (type) {
      case 'email':
        // Check if user's email is verified
        if (!session.user?.emailVerified) {
          return NextResponse.json(
            { error: 'Email not verified' },
            { status: 400 }
          )
        }
        badge = await verifyEmailBadge(session.userId)
        break

      case 'identity':
        const identityData = verifyIdentitySchema.parse(body)
        // In production, verify the signature against the wallet
        badge = await verifyIdentityBadge(
          session.userId,
          session.user?.walletAddress || '',
          identityData.signature
        )
        break

      case 'professional':
        // Get user's professional stats
        const stats = await getFreelancerStats(session.userId)

        if (!stats) {
          return NextResponse.json(
            { error: 'No professional profile found' },
            { status: 400 }
          )
        }

        badge = await verifyProfessionalBadge(session.userId, {
          portfolioCount: stats.portfolioCount || 0,
          completedJobs: stats.completedJobs || 0,
          averageRating: stats.averageRating || 0
        })

        if (!badge) {
          return NextResponse.json(
            {
              error: 'Does not meet professional verification requirements',
              requirements: {
                portfolioCount: 'Minimum 3 portfolio items',
                completedJobs: 'Minimum 5 completed jobs',
                averageRating: 'Minimum 4.0 average rating'
              }
            },
            { status: 400 }
          )
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid verification type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      badge
    })
  } catch (error) {
    console.error('Error creating verification badge:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create verification badge' },
      { status: 500 }
    )
  }
}
