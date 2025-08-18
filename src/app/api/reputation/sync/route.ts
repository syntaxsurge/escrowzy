import { NextRequest, NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { findUserById } from '@/lib/db/queries/users'
import { reputationRegistry } from '@/lib/db/schema'

export async function POST(request: NextRequest) {
  try {
    const { userId, averageRating, reviewCount, isFreelancer } =
      await request.json()

    if (!userId || averageRating === undefined || reviewCount === undefined) {
      return NextResponse.json(
        { message: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Get user details
    const user = await findUserById(userId)
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    if (!user.walletAddress) {
      return NextResponse.json(
        { message: 'User does not have a wallet address' },
        { status: 400 }
      )
    }

    // Update or create reputation registry entry
    const existingEntry = await db
      .select()
      .from(reputationRegistry)
      .where(eq(reputationRegistry.userId, userId))
      .limit(1)

    const reputationScore = Math.round(averageRating * 20) // Convert 0-5 rating to 0-100 score

    // Generate a deterministic transaction hash for tracking
    const txHash = `0x${Buffer.from(`reputation-${userId}-${Date.now()}`).toString('hex').padEnd(64, '0').slice(0, 64)}`

    if (existingEntry.length > 0) {
      // Update existing entry
      await db
        .update(reputationRegistry)
        .set({
          reputationScore,
          totalReviews: reviewCount,
          averageRating: averageRating.toFixed(2),
          isFreelancer,
          lastUpdated: new Date(),
          updatedAt: new Date(),
          metadata: {
            averageRating,
            syncedAt: new Date().toISOString(),
            txHash
          }
        })
        .where(eq(reputationRegistry.userId, userId))
    } else {
      // Create new entry
      await db.insert(reputationRegistry).values({
        userId,
        walletAddress: user.walletAddress,
        reputationScore,
        totalReviews: reviewCount,
        averageRating: averageRating.toFixed(2),
        isFreelancer,
        lastUpdated: new Date(),
        metadata: {
          averageRating,
          syncedAt: new Date().toISOString(),
          txHash
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Reputation successfully synced',
      txHash
    })
  } catch (error) {
    console.error('Error syncing reputation:', error)
    return NextResponse.json(
      { message: 'Internal server error while syncing reputation' },
      { status: 500 }
    )
  }
}
