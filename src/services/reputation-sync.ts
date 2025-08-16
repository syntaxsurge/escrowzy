import 'server-only'

import { eq, sql } from 'drizzle-orm'

import { getBlockchainConfig } from '@/lib/blockchain'
import { db } from '@/lib/db/drizzle'
import {
  freelancerReviews,
  clientReviews,
  users,
  userGameData
} from '@/lib/db/schema'

// Mock ABI for ReputationRegistry - replace with actual ABI when available
const ReputationRegistryABI = [
  {
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'rating', type: 'uint256' },
      { name: 'isFreelancer', type: 'bool' }
    ],
    name: 'updateReputation',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'badgeLevel', type: 'uint256' }
    ],
    name: 'mintReputationBadge',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getTrustScore',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserBadges',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'applyDecay',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const

interface ReputationData {
  userId: number
  walletAddress: string
  trustScore: number
  totalReviews: number
  avgRating: number
  completedJobs: number
  isFreelancer: boolean
}

export class ReputationSyncService {
  private contractAddress: string
  private chainId: number

  constructor(chainId: number = 1) {
    this.chainId = chainId
    const config = getBlockchainConfig()
    const chainConfig = config.chains[chainId]

    // Check if reputationRegistry exists in the config (it's optional and not deployed yet)
    const reputationAddress = (chainConfig?.contractAddresses as any)
      ?.reputationRegistry

    if (!reputationAddress) {
      // Use a placeholder address if not configured
      this.contractAddress = '0x0000000000000000000000000000000000000000'
      console.warn(
        `ReputationRegistry contract not deployed on chain ${chainId}`
      )
    } else {
      this.contractAddress = reputationAddress
    }
  }

  async syncUserReputation(userId: number): Promise<{
    success: boolean
    txHash?: string
    message: string
  }> {
    try {
      // Get user data
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      if (!user || !user.walletAddress) {
        return {
          success: false,
          message: 'User not found or missing wallet address'
        }
      }

      // Calculate reputation metrics
      const reputationData = await this.calculateReputation(
        userId,
        user.walletAddress
      )

      // Update onchain (mock for now)
      const txHash = await this.updateOnchainReputation(reputationData)

      // Store sync timestamp
      await this.recordSyncEvent(userId, txHash)

      return {
        success: true,
        txHash,
        message: 'Reputation synced successfully'
      }
    } catch (error) {
      console.error('Error syncing reputation:', error)
      return {
        success: false,
        message: 'Failed to sync reputation'
      }
    }
  }

  private async calculateReputation(
    userId: number,
    walletAddress: string
  ): Promise<ReputationData> {
    // Get freelancer reviews
    const freelancerReviewsResult = await db
      .select({
        count: sql<number>`count(*)`,
        avgRating: sql<number>`avg(${freelancerReviews.rating})`
      })
      .from(freelancerReviews)
      .where(eq(freelancerReviews.freelancerId, userId))

    // Get client reviews
    const clientReviewsResult = await db
      .select({
        count: sql<number>`count(*)`,
        avgRating: sql<number>`avg(${clientReviews.rating})`
      })
      .from(clientReviews)
      .where(eq(clientReviews.clientId, userId))

    const totalFreelancerReviews = freelancerReviewsResult[0]?.count || 0
    const avgFreelancerRating = freelancerReviewsResult[0]?.avgRating || 0
    const totalClientReviews = clientReviewsResult[0]?.count || 0
    const avgClientRating = clientReviewsResult[0]?.avgRating || 0

    // Determine if primarily freelancer or client
    const isFreelancer = totalFreelancerReviews > totalClientReviews

    // Calculate combined metrics
    const totalReviews = totalFreelancerReviews + totalClientReviews
    const avgRating =
      totalReviews > 0
        ? (avgFreelancerRating * totalFreelancerReviews +
            avgClientRating * totalClientReviews) /
          totalReviews
        : 0

    // Get completed jobs count from game data
    const [gameData] = await db
      .select()
      .from(userGameData)
      .where(eq(userGameData.userId, userId))
      .limit(1)

    const freelancerStats = (gameData?.freelancerStats || {}) as any
    const completedJobs = freelancerStats.jobsCompleted || 0

    // Calculate trust score (0-100)
    const trustScore = this.calculateTrustScore({
      avgRating,
      totalReviews,
      completedJobs
    })

    return {
      userId,
      walletAddress,
      trustScore,
      totalReviews,
      avgRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
      completedJobs,
      isFreelancer
    }
  }

  private calculateTrustScore(metrics: {
    avgRating: number
    totalReviews: number
    completedJobs: number
  }): number {
    const { avgRating, totalReviews, completedJobs } = metrics

    // Weight factors
    const ratingWeight = 0.5
    const reviewWeight = 0.3
    const jobWeight = 0.2

    // Normalize rating (0-100)
    const ratingScore = (avgRating / 5) * 100

    // Normalize review count (logarithmic scale, max 100)
    const reviewScore = Math.min(Math.log10(totalReviews + 1) * 25, 100)

    // Normalize job count (logarithmic scale, max 100)
    const jobScore = Math.min(Math.log10(completedJobs + 1) * 20, 100)

    // Calculate weighted trust score
    const trustScore =
      ratingScore * ratingWeight +
      reviewScore * reviewWeight +
      jobScore * jobWeight

    return Math.round(trustScore)
  }

  private async updateOnchainReputation(data: ReputationData): Promise<string> {
    try {
      // For now, return a mock transaction hash
      // In production, this would interact with the blockchain
      const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64)

      console.log('Would update onchain reputation:', {
        address: data.walletAddress,
        rating: data.avgRating,
        trustScore: data.trustScore,
        isFreelancer: data.isFreelancer
      })

      // If trust score is high enough, would mint reputation NFT
      if (data.trustScore >= 80 && data.totalReviews >= 10) {
        await this.mintReputationBadge(data)
      }

      return mockTxHash
    } catch (error) {
      console.error('Error updating onchain reputation:', error)
      throw error
    }
  }

  private async mintReputationBadge(data: ReputationData): Promise<void> {
    try {
      // Determine badge level based on trust score
      let badgeLevel = 1 // Bronze
      if (data.trustScore >= 95)
        badgeLevel = 4 // Diamond
      else if (data.trustScore >= 90)
        badgeLevel = 3 // Gold
      else if (data.trustScore >= 85) badgeLevel = 2 // Silver

      console.log('Would mint reputation badge:', {
        address: data.walletAddress,
        badgeLevel
      })
    } catch (error) {
      console.error('Error minting reputation badge:', error)
      // Don't throw - badge minting is optional
    }
  }

  private async recordSyncEvent(userId: number, txHash: string): Promise<void> {
    const [gameData] = await db
      .select()
      .from(userGameData)
      .where(eq(userGameData.userId, userId))
      .limit(1)

    const currentStats = (gameData?.stats || {}) as any
    const reputationSync = currentStats.reputationSync || { history: [] }

    reputationSync.lastSync = new Date().toISOString()
    reputationSync.lastTxHash = txHash
    reputationSync.history.push({
      timestamp: new Date().toISOString(),
      txHash
    })

    // Keep only last 10 sync events
    if (reputationSync.history.length > 10) {
      reputationSync.history = reputationSync.history.slice(-10)
    }

    const updatedStats = {
      ...currentStats,
      reputationSync
    }

    await db
      .update(userGameData)
      .set({
        stats: updatedStats,
        updatedAt: new Date()
      })
      .where(eq(userGameData.userId, userId))
  }

  async getOnchainReputation(walletAddress: string): Promise<{
    trustScore: number
    totalReviews: number
    lastUpdated: Date
    badges: number[]
  } | null> {
    try {
      // Mock implementation for now
      console.log('Would fetch onchain reputation for:', walletAddress)

      return {
        trustScore: 85,
        totalReviews: 12,
        lastUpdated: new Date(),
        badges: [1, 2]
      }
    } catch (error) {
      console.error('Error fetching onchain reputation:', error)
      return null
    }
  }

  async syncAllUsersReputation(): Promise<{
    synced: number
    failed: number
    errors: string[]
  }> {
    const errors: string[] = []
    let synced = 0
    let failed = 0

    try {
      // Get all users with reviews
      const usersToSync = await db.select({ userId: users.id }).from(users)
        .where(sql`
          EXISTS (
            SELECT 1 FROM ${freelancerReviews} 
            WHERE ${freelancerReviews.freelancerId} = ${users.id}
          ) OR EXISTS (
            SELECT 1 FROM ${clientReviews}
            WHERE ${clientReviews.clientId} = ${users.id}
          )
        `)

      for (const { userId } of usersToSync) {
        const result = await this.syncUserReputation(userId)

        if (result.success) {
          synced++
        } else {
          failed++
          errors.push(`User ${userId}: ${result.message}`)
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      return { synced, failed, errors }
    } catch (error) {
      console.error('Error in bulk reputation sync:', error)
      return { synced, failed, errors: [`Bulk sync failed: ${error}`] }
    }
  }

  async applyReputationDecay(): Promise<void> {
    try {
      // Mock implementation
      console.log('Would apply reputation decay to inactive users')
    } catch (error) {
      console.error('Error applying reputation decay:', error)
    }
  }
}
