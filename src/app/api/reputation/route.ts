import { NextRequest, NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { getAuthSession } from '@/lib/auth'
import { db } from '@/lib/db/drizzle'
import {
  getUserReputation,
  getTopReputationUsers,
  getUserReputationNFTs
} from '@/lib/db/queries/reputation'
import { users } from '@/lib/db/schema'
import { reputationSyncService } from '@/services/reputation-sync.service'

const querySchema = z.object({
  userId: z.string().optional(),
  isFreelancer: z.enum(['true', 'false']).optional().default('true'),
  top: z.string().optional()
})

/**
 * GET /api/reputation
 * Get user reputation or top reputation users
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = querySchema.parse({
      userId: searchParams.get('userId') || undefined,
      isFreelancer: searchParams.get('isFreelancer') || 'true',
      top: searchParams.get('top') || undefined
    })

    // Get top reputation users if requested
    if (params.top) {
      const limit = parseInt(params.top, 10)
      if (isNaN(limit) || limit < 1 || limit > 100) {
        return NextResponse.json(
          { error: 'Invalid top parameter. Must be between 1 and 100.' },
          { status: 400 }
        )
      }

      const topUsers = await getTopReputationUsers(
        limit,
        params.isFreelancer === 'true'
      )

      return NextResponse.json({
        success: true,
        data: topUsers
      })
    }

    // Get specific user reputation
    const session = await getAuthSession()
    const userId = params.userId
      ? parseInt(params.userId, 10)
      : session?.user?.id

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const reputation = await getUserReputation(
      userId,
      params.isFreelancer === 'true'
    )

    if (!reputation) {
      return NextResponse.json({
        success: true,
        data: {
          userId,
          totalReviews: 0,
          averageRating: 0,
          reputationScore: 0,
          isFreelancer: params.isFreelancer === 'true'
        }
      })
    }

    // Get NFTs for the user
    const nfts = await getUserReputationNFTs(userId)

    return NextResponse.json({
      success: true,
      data: {
        ...reputation,
        nfts: nfts.map(nft => ({
          id: nft.id,
          type: nft.nftType,
          level: nft.reputationLevel,
          tokenId: nft.tokenId,
          mintedAt: nft.mintedAt
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching reputation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reputation' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/reputation/sync
 * Sync reputation for current user or specified user (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const userId = body.userId || session.user.id

    // Only allow syncing own reputation or admin can sync any
    if (userId !== session.user.id) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1)

      if (!user || user.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Perform reputation sync
    const result = await reputationSyncService.syncUserReputation(userId)

    return NextResponse.json({
      success: true,
      data: {
        freelancerReputation: result.freelancerReputation,
        clientReputation: result.clientReputation,
        nftsMinted: result.nftsMinted,
        achievementsAwarded: result.achievementsAwarded
      }
    })
  } catch (error) {
    console.error('Error syncing reputation:', error)
    return NextResponse.json(
      { error: 'Failed to sync reputation' },
      { status: 500 }
    )
  }
}
