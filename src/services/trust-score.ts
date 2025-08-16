import 'server-only'

import { eq, and, gte, sql } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import {
  userGameData,
  freelancerReviews,
  clientReviews,
  jobPostings,
  verificationBadges,
  skillEndorsements
} from '@/lib/db/schema'

export interface TrustScoreComponents {
  reviewScore: number // Based on average rating and review count
  completionScore: number // Based on job completion rate
  verificationScore: number // Based on verification badges
  endorsementScore: number // Based on skill endorsements
  activityScore: number // Based on recent activity
  disputeScore: number // Based on dispute history
}

export interface TrustScoreResult {
  totalScore: number // 0-100
  level: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
  components: TrustScoreComponents
  lastCalculated: Date
  nextMilestone: number
  recommendations: string[]
}

export class TrustScoreService {
  private readonly weights = {
    reviews: 0.3, // 30% weight
    completion: 0.25, // 25% weight
    verification: 0.15, // 15% weight
    endorsements: 0.15, // 15% weight
    activity: 0.1, // 10% weight
    disputes: 0.05 // 5% weight
  }

  async calculateTrustScore(userId: number): Promise<TrustScoreResult> {
    const [
      reviewScore,
      completionScore,
      verificationScore,
      endorsementScore,
      activityScore,
      disputeScore
    ] = await Promise.all([
      this.calculateReviewScore(userId),
      this.calculateCompletionScore(userId),
      this.calculateVerificationScore(userId),
      this.calculateEndorsementScore(userId),
      this.calculateActivityScore(userId),
      this.calculateDisputeScore(userId)
    ])

    const components: TrustScoreComponents = {
      reviewScore,
      completionScore,
      verificationScore,
      endorsementScore,
      activityScore,
      disputeScore
    }

    // Calculate weighted total score
    const totalScore = Math.round(
      reviewScore * this.weights.reviews +
        completionScore * this.weights.completion +
        verificationScore * this.weights.verification +
        endorsementScore * this.weights.endorsements +
        activityScore * this.weights.activity +
        disputeScore * this.weights.disputes
    )

    const level = this.getScoreLevel(totalScore)
    const nextMilestone = this.getNextMilestone(totalScore)
    const recommendations = this.getRecommendations(components)

    // Store the trust score in database
    await this.storeTrustScore(userId, totalScore, components)

    return {
      totalScore,
      level,
      components,
      lastCalculated: new Date(),
      nextMilestone,
      recommendations
    }
  }

  private async calculateReviewScore(userId: number): Promise<number> {
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

    const totalReviews =
      (freelancerReviewsResult[0]?.count || 0) +
      (clientReviewsResult[0]?.count || 0)

    const avgRating =
      totalReviews > 0
        ? ((freelancerReviewsResult[0]?.avgRating || 0) *
            (freelancerReviewsResult[0]?.count || 0) +
            (clientReviewsResult[0]?.avgRating || 0) *
              (clientReviewsResult[0]?.count || 0)) /
          totalReviews
        : 0

    // Score based on average rating (0-70) and review count (0-30)
    const ratingScore = (avgRating / 5) * 70
    const countScore = Math.min(totalReviews * 2, 30) // Cap at 30 points for 15+ reviews

    return Math.round(ratingScore + countScore)
  }

  private async calculateCompletionScore(userId: number): Promise<number> {
    // Get job statistics
    const jobStats = await db
      .select({
        totalJobs: sql<number>`count(*)`,
        completedJobs: sql<number>`sum(case when status = 'completed' then 1 else 0 end)`,
        cancelledJobs: sql<number>`sum(case when status = 'cancelled' then 1 else 0 end)`
      })
      .from(jobPostings)
      .where(
        sql`${jobPostings.clientId} = ${userId} OR ${jobPostings.freelancerId} = ${userId}`
      )

    const total = jobStats[0]?.totalJobs || 0
    const completed = jobStats[0]?.completedJobs || 0
    const cancelled = jobStats[0]?.cancelledJobs || 0

    if (total === 0) return 50 // Neutral score for new users

    const completionRate = completed / total
    const cancellationPenalty = (cancelled / total) * 20

    return Math.round(Math.max(0, completionRate * 100 - cancellationPenalty))
  }

  private async calculateVerificationScore(userId: number): Promise<number> {
    const badges = await db
      .select()
      .from(verificationBadges)
      .where(
        and(
          eq(verificationBadges.userId, userId),
          eq(verificationBadges.isActive, true)
        )
      )

    const badgeScores: Record<string, number> = {
      email: 20,
      identity: 25,
      phone: 15,
      professional: 25,
      kyc: 15
    }

    let score = 0
    const uniqueBadgeTypes = new Set<string>()

    badges.forEach(badge => {
      if (!uniqueBadgeTypes.has(badge.badgeType)) {
        uniqueBadgeTypes.add(badge.badgeType)
        score += badgeScores[badge.badgeType] || 0
      }
    })

    return Math.min(100, score)
  }

  private async calculateEndorsementScore(userId: number): Promise<number> {
    const endorsements = await db
      .select({
        count: sql<number>`count(*)`,
        avgRating: sql<number>`avg(${skillEndorsements.rating})`,
        verifiedCount: sql<number>`sum(case when ${skillEndorsements.verified} then 1 else 0 end)`,
        uniqueEndorsers: sql<number>`count(distinct ${skillEndorsements.endorserId})`
      })
      .from(skillEndorsements)
      .where(eq(skillEndorsements.endorsedUserId, userId))

    const data = endorsements[0]
    if (!data || data.count === 0) return 0

    const avgRating = data.avgRating || 0
    const verifiedRatio = (data.verifiedCount || 0) / data.count
    const diversityScore = Math.min(data.uniqueEndorsers * 5, 30) // Cap at 30 for 6+ unique endorsers

    const ratingScore = (avgRating / 5) * 40
    const verifiedBonus = verifiedRatio * 30

    return Math.round(ratingScore + verifiedBonus + diversityScore)
  }

  private async calculateActivityScore(userId: number): Promise<number> {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Check recent activity
    const [userData] = await db
      .select()
      .from(userGameData)
      .where(eq(userGameData.userId, userId))
      .limit(1)

    if (!userData) return 0

    // Check login streak
    const loginStreakScore = Math.min(userData.loginStreak * 5, 30)

    // Check recent job activity
    const recentJobs = await db
      .select({ count: sql<number>`count(*)` })
      .from(jobPostings)
      .where(
        and(
          sql`${jobPostings.clientId} = ${userId} OR ${jobPostings.freelancerId} = ${userId}`,
          gte(jobPostings.createdAt, thirtyDaysAgo)
        )
      )

    const jobActivityScore = Math.min((recentJobs[0]?.count || 0) * 10, 40)

    // Check level progression
    const levelScore = Math.min(userData.level * 3, 30)

    return Math.round(loginStreakScore + jobActivityScore + levelScore)
  }

  private async calculateDisputeScore(userId: number): Promise<number> {
    // Import review disputes table
    const { reviewDisputes } = await import('@/lib/db/schema')

    const disputes = await db
      .select({
        total: sql<number>`count(*)`,
        upheld: sql<number>`sum(case when resolution = 'upheld' then 1 else 0 end)`,
        dismissed: sql<number>`sum(case when resolution = 'dismissed' then 1 else 0 end)`
      })
      .from(reviewDisputes)
      .where(eq(reviewDisputes.disputedBy, userId))

    const data = disputes[0]
    if (!data || data.total === 0) return 100 // Perfect score if no disputes

    const upheldRatio = (data.upheld || 0) / data.total
    const dismissedRatio = (data.dismissed || 0) / data.total

    // Penalize for upheld disputes (user was wrong)
    // Reward for dismissed disputes (user was right)
    const score = 100 - upheldRatio * 50 + dismissedRatio * 10

    return Math.round(Math.max(0, Math.min(100, score)))
  }

  private getScoreLevel(score: number): TrustScoreResult['level'] {
    if (score >= 90) return 'diamond'
    if (score >= 80) return 'platinum'
    if (score >= 70) return 'gold'
    if (score >= 60) return 'silver'
    return 'bronze'
  }

  private getNextMilestone(score: number): number {
    const milestones = [60, 70, 80, 90, 100]
    return milestones.find(m => m > score) || 100
  }

  private getRecommendations(components: TrustScoreComponents): string[] {
    const recommendations: string[] = []

    if (components.reviewScore < 70) {
      recommendations.push(
        'Improve your review ratings by delivering quality work'
      )
    }
    if (components.completionScore < 70) {
      recommendations.push('Focus on completing more jobs successfully')
    }
    if (components.verificationScore < 50) {
      recommendations.push('Get verified to increase trust')
    }
    if (components.endorsementScore < 50) {
      recommendations.push('Request skill endorsements from colleagues')
    }
    if (components.activityScore < 50) {
      recommendations.push('Stay active on the platform to maintain trust')
    }

    return recommendations
  }

  private async storeTrustScore(
    userId: number,
    score: number,
    components: TrustScoreComponents
  ): Promise<void> {
    const [userData] = await db
      .select()
      .from(userGameData)
      .where(eq(userGameData.userId, userId))
      .limit(1)

    if (!userData) return

    const currentStats = (userData.stats || {}) as any
    const updatedStats = {
      ...currentStats,
      trustScore: {
        score,
        components,
        lastCalculated: new Date().toISOString(),
        history: [
          ...(currentStats.trustScore?.history || []).slice(-9), // Keep last 9
          {
            score,
            timestamp: new Date().toISOString()
          }
        ]
      }
    }

    await db
      .update(userGameData)
      .set({
        stats: updatedStats,
        updatedAt: new Date()
      })
      .where(eq(userGameData.userId, userId))
  }

  async getTrustScoreHistory(userId: number): Promise<
    Array<{
      score: number
      timestamp: string
    }>
  > {
    const [userData] = await db
      .select()
      .from(userGameData)
      .where(eq(userGameData.userId, userId))
      .limit(1)

    const stats = (userData?.stats || {}) as any
    return stats.trustScore?.history || []
  }

  async getTrustScoreBadge(score: number): Promise<{
    name: string
    icon: string
    color: string
    description: string
  }> {
    const level = this.getScoreLevel(score)

    const badges = {
      bronze: {
        name: 'Bronze Trust',
        icon: '🥉',
        color: 'text-orange-600',
        description: 'Building trust in the community'
      },
      silver: {
        name: 'Silver Trust',
        icon: '🥈',
        color: 'text-gray-500',
        description: 'Established member with good reputation'
      },
      gold: {
        name: 'Gold Trust',
        icon: '🥇',
        color: 'text-yellow-500',
        description: 'Highly trusted community member'
      },
      platinum: {
        name: 'Platinum Trust',
        icon: '💎',
        color: 'text-blue-600',
        description: 'Exceptional trust and reliability'
      },
      diamond: {
        name: 'Diamond Trust',
        icon: '💠',
        color: 'text-purple-600',
        description: 'Elite trusted status'
      }
    }

    return badges[level]
  }

  async applyDecay(userId: number): Promise<number> {
    const currentScore = await this.calculateTrustScore(userId)
    const lastActivity = await this.getLastActivityDate(userId)

    if (!lastActivity) return currentScore.totalScore

    const daysSinceActivity = Math.floor(
      (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Apply 1% decay per week of inactivity after 30 days
    if (daysSinceActivity > 30) {
      const weeksInactive = Math.floor((daysSinceActivity - 30) / 7)
      const decayFactor = Math.max(0.7, 1 - weeksInactive * 0.01) // Cap at 30% decay

      const decayedScore = Math.round(currentScore.totalScore * decayFactor)

      // Store the decayed score
      await this.storeTrustScore(userId, decayedScore, currentScore.components)

      return decayedScore
    }

    return currentScore.totalScore
  }

  private async getLastActivityDate(userId: number): Promise<Date | null> {
    const [userData] = await db
      .select()
      .from(userGameData)
      .where(eq(userGameData.userId, userId))
      .limit(1)

    return userData?.updatedAt || null
  }
}
