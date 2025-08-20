import { NextRequest, NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { getServerSession } from '@/lib/auth/session'
import { db } from '@/lib/db/drizzle'
import { getFreelancerStats } from '@/lib/db/queries/freelancers'
import {
  getUserVerificationBadges,
  getVerificationStatus,
  verifyEmailBadge,
  verifyIdentityBadge,
  verifyProfessionalBadge
} from '@/lib/db/queries/verification-badges'
import { users } from '@/lib/db/schema'

const verifyIdentitySchema = z.object({
  signature: z.string(),
  message: z.string()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const targetUserId = userId ? parseInt(userId) : session.user.id

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
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type } = body

    let badge = null

    switch (type) {
      case 'email':
        // Check if user's email is verified
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, session.user.id))
          .limit(1)

        if (!user?.emailVerified) {
          return NextResponse.json(
            { error: 'Email not verified' },
            { status: 400 }
          )
        }
        badge = await verifyEmailBadge(session.user.id)
        break

      case 'identity':
        const identityData = verifyIdentitySchema.parse(body)
        // In production, verify the signature against the wallet
        badge = await verifyIdentityBadge(
          session.user.id,
          session.user.walletAddress,
          identityData.signature
        )
        break

      case 'professional':
        // Get user's professional stats
        const stats = await getFreelancerStats(session.user.id)

        if (!stats) {
          return NextResponse.json(
            { error: 'No professional profile found' },
            { status: 400 }
          )
        }

        // For now, use placeholder values since these fields aren't in ProfileStats
        badge = await verifyProfessionalBadge(session.user.id, {
          portfolioCount: 3, // Placeholder - would be fetched from portfolio table
          completedJobs: stats.completedJobs || 0,
          averageRating: 4.5 // Placeholder - would be calculated from reviews
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
