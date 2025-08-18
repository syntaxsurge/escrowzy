import 'server-only'

import { db } from '@/lib/db/drizzle'
import {
  syncReputationFromReviews,
  getUserReputation,
  getReputationLevel,
  mintReputationNFT,
  hasReputationNFT
} from '@/lib/db/queries/reputation'
import {
  getFreelancerReviews,
  getClientReviews
} from '@/lib/db/queries/reviews'

import { checkAndAwardAchievements } from './achievement-triggers'
import { TrustScoreService } from './trust-score'

/**
 * Production-ready reputation synchronization service
 * Updates reputation registry and mints NFTs based on review data
 */
export class ReputationSyncService {
  private trustScoreService: TrustScoreService

  constructor() {
    this.trustScoreService = new TrustScoreService()
  }

  /**
   * Sync reputation for a user after a new review
   */
  async syncUserReputation(userId: number): Promise<{
    freelancerReputation?: any
    clientReputation?: any
    nftsMinted: string[]
    achievementsAwarded: string[]
  }> {
    const result = {
      freelancerReputation: undefined as any,
      clientReputation: undefined as any,
      nftsMinted: [] as string[],
      achievementsAwarded: [] as string[]
    }

    try {
      // Sync reputation from reviews
      const syncResult = await syncReputationFromReviews(userId)
      result.freelancerReputation = syncResult.freelancerReputation
      result.clientReputation = syncResult.clientReputation

      // Check and mint reputation NFTs for freelancer
      if (result.freelancerReputation) {
        const level = getReputationLevel(
          result.freelancerReputation.reputationScore
        )
        const hasNFT = await hasReputationNFT(userId, level)

        // Only mint NFTs for silver level and above
        if (!hasNFT && result.freelancerReputation.reputationScore >= 40) {
          const nft = await mintReputationNFT(userId, level)
          result.nftsMinted.push(`${level}_reputation`)

          // Award achievement for reputation milestone
          const achievements = await checkAndAwardAchievements(
            userId,
            'reputation_milestone'
          )
          result.achievementsAwarded.push(...achievements)
        }
      }

      // Check for review streak achievements
      const freelancerReviews = await getFreelancerReviews(userId)
      if (freelancerReviews.stats.totalReviews > 0) {
        // Check for review milestones
        const reviewMilestones = [
          { count: 10, achievement: 'REVIEW_MILESTONE_10' },
          { count: 50, achievement: 'REVIEW_MILESTONE_50' },
          { count: 100, achievement: 'REVIEW_MILESTONE_100' }
        ]

        for (const milestone of reviewMilestones) {
          if (freelancerReviews.stats.totalReviews >= milestone.count) {
            const achievements = await checkAndAwardAchievements(
              userId,
              'review_milestone'
            )
            result.achievementsAwarded.push(...achievements)
          }
        }

        // Check for perfect rating achievements
        if (
          freelancerReviews.stats.averageRating >= 4.9 &&
          freelancerReviews.stats.totalReviews >= 10
        ) {
          const achievements = await checkAndAwardAchievements(
            userId,
            'perfect_rating'
          )
          result.achievementsAwarded.push(...achievements)
        }
      }

      return result
    } catch (error) {
      console.error('Error syncing user reputation:', error)
      throw error
    }
  }

  /**
   * Batch sync reputation for multiple users
   */
  async batchSyncReputation(userIds: number[]): Promise<{
    successful: number[]
    failed: number[]
    totalNFTsMinted: number
    totalAchievements: number
  }> {
    const result = {
      successful: [] as number[],
      failed: [] as number[],
      totalNFTsMinted: 0,
      totalAchievements: 0
    }

    for (const userId of userIds) {
      try {
        const syncResult = await this.syncUserReputation(userId)
        result.successful.push(userId)
        result.totalNFTsMinted += syncResult.nftsMinted.length
        result.totalAchievements += syncResult.achievementsAwarded.length
      } catch (error) {
        console.error(`Failed to sync reputation for user ${userId}:`, error)
        result.failed.push(userId)
      }
    }

    return result
  }

  /**
   * Apply reputation decay (1% weekly after 30 days of inactivity)
   */
  async applyReputationDecay(): Promise<{
    affectedUsers: number
    totalDecayApplied: number
  }> {
    try {
      // Get users with reputation that haven't been updated in 30+ days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { reputationRegistry } = await import('@/lib/db/schema')
      const { lt, gt, and, eq, sql } = await import('drizzle-orm')

      const staleReputations = await db
        .select()
        .from(reputationRegistry)
        .where(
          and(
            lt(reputationRegistry.lastUpdated, thirtyDaysAgo),
            gt(reputationRegistry.reputationScore, 0)
          )
        )

      let affectedUsers = 0
      let totalDecayApplied = 0

      for (const rep of staleReputations) {
        // Calculate weeks since last update
        const weeksSinceUpdate = Math.floor(
          (Date.now() - rep.lastUpdated.getTime()) / (7 * 24 * 60 * 60 * 1000)
        )

        // Apply 1% decay per week
        const decayPercentage = Math.min(weeksSinceUpdate * 0.01, 0.5) // Cap at 50% max decay
        const decayAmount = Math.floor(rep.reputationScore * decayPercentage)

        if (decayAmount > 0) {
          const newScore = Math.max(0, rep.reputationScore - decayAmount)

          await db
            .update(reputationRegistry)
            .set({
              reputationScore: newScore,
              metadata: {
                ...((rep.metadata as object) || {}),
                lastDecay: new Date().toISOString()
              },
              updatedAt: new Date()
            })
            .where(eq(reputationRegistry.id, rep.id))

          affectedUsers++
          totalDecayApplied += decayAmount
        }
      }

      return {
        affectedUsers,
        totalDecayApplied
      }
    } catch (error) {
      console.error('Error applying reputation decay:', error)
      throw error
    }
  }

  /**
   * Get reputation statistics for analytics
   */
  async getReputationStats(): Promise<{
    totalUsers: number
    averageScore: number
    topPerformers: number
    nftsIssued: number
    levelDistribution: Record<string, number>
  }> {
    try {
      const { reputationRegistry, reputationNFTs } = await import(
        '@/lib/db/schema'
      )
      const { eq, sql, and, gte, lt } = await import('drizzle-orm')

      const [stats] = await db
        .select({
          totalUsers: sql<number>`count(*)`,
          avgScore: sql<number>`avg(${reputationRegistry.reputationScore})`,
          diamondCount: sql<number>`sum(case when ${reputationRegistry.reputationScore} >= 90 then 1 else 0 end)`,
          platinumCount: sql<number>`sum(case when ${reputationRegistry.reputationScore} >= 75 and ${reputationRegistry.reputationScore} < 90 then 1 else 0 end)`,
          goldCount: sql<number>`sum(case when ${reputationRegistry.reputationScore} >= 60 and ${reputationRegistry.reputationScore} < 75 then 1 else 0 end)`,
          silverCount: sql<number>`sum(case when ${reputationRegistry.reputationScore} >= 40 and ${reputationRegistry.reputationScore} < 60 then 1 else 0 end)`,
          bronzeCount: sql<number>`sum(case when ${reputationRegistry.reputationScore} < 40 then 1 else 0 end)`
        })
        .from(reputationRegistry)
        .where(eq(reputationRegistry.isFreelancer, true))

      const [nftCount] = await db
        .select({
          count: sql<number>`count(*)`
        })
        .from(reputationNFTs)
        .where(eq(reputationNFTs.nftType, 'reputation'))

      return {
        totalUsers: Number(stats?.totalUsers || 0),
        averageScore: Number(stats?.avgScore || 0),
        topPerformers:
          Number(stats?.diamondCount || 0) + Number(stats?.platinumCount || 0),
        nftsIssued: Number(nftCount?.count || 0),
        levelDistribution: {
          diamond: Number(stats?.diamondCount || 0),
          platinum: Number(stats?.platinumCount || 0),
          gold: Number(stats?.goldCount || 0),
          silver: Number(stats?.silverCount || 0),
          bronze: Number(stats?.bronzeCount || 0)
        }
      }
    } catch (error) {
      console.error('Error getting reputation stats:', error)
      throw error
    }
  }

  /**
   * Verify reputation integrity
   */
  async verifyReputationIntegrity(userId: number): Promise<{
    isValid: boolean
    issues: string[]
  }> {
    const issues: string[] = []

    try {
      // Get user's reputation
      const freelancerRep = await getUserReputation(userId, true)
      const clientRep = await getUserReputation(userId, false)

      // Verify freelancer reputation matches reviews
      if (freelancerRep) {
        const reviews = await getFreelancerReviews(userId)
        if (reviews.stats.totalReviews !== freelancerRep.totalReviews) {
          issues.push('Review count mismatch for freelancer reputation')
        }
        if (
          Math.abs(reviews.stats.averageRating - freelancerRep.averageRating) >
          0.1
        ) {
          issues.push('Average rating mismatch for freelancer reputation')
        }
      }

      // Verify client reputation matches reviews
      if (clientRep) {
        const reviews = await getClientReviews(userId)
        if (reviews.stats.totalReviews !== clientRep.totalReviews) {
          issues.push('Review count mismatch for client reputation')
        }
        if (
          Math.abs(reviews.stats.averageRating - clientRep.averageRating) > 0.1
        ) {
          issues.push('Average rating mismatch for client reputation')
        }
      }

      // Verify NFT consistency
      if (freelancerRep && freelancerRep.reputationScore >= 40) {
        const level = getReputationLevel(freelancerRep.reputationScore)
        const hasNFT = await hasReputationNFT(userId, level)
        if (!hasNFT) {
          issues.push(`Missing ${level} reputation NFT for eligible user`)
        }
      }

      return {
        isValid: issues.length === 0,
        issues
      }
    } catch (error) {
      console.error('Error verifying reputation integrity:', error)
      return {
        isValid: false,
        issues: ['Error during verification: ' + (error as Error).message]
      }
    }
  }
}

// Export singleton instance
export const reputationSyncService = new ReputationSyncService()
