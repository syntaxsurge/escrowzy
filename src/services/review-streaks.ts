import 'server-only'

import { eq, sql } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import {
  freelancerReviews,
  clientReviews,
  users,
  userGameData,
  jobPostings
} from '@/lib/db/schema'

import { checkAndAwardAchievements } from './achievement-triggers'
import { RewardsService } from './rewards'

interface ReviewStreak {
  userId: number
  currentStreak: number
  longestStreak: number
  lastReviewDate: Date | null
  totalOnTimeReviews: number
  streakMultiplier: number
}

const STREAK_WINDOW_DAYS = 7 // Must review within 7 days to maintain streak
const BASE_STREAK_XP = 10
const STREAK_MULTIPLIER_INCREMENT = 0.25
const MAX_STREAK_MULTIPLIER = 3.0

export async function getReviewStreak(userId: number): Promise<ReviewStreak> {
  try {
    // Get user's game data
    const [userData] = await db
      .select()
      .from(userGameData)
      .where(eq(userGameData.userId, userId))
      .limit(1)

    const streakData = userData?.stats as {
      reviewStreak?: {
        current: number
        longest: number
        lastReviewDate: string | null
        totalOnTime: number
      }
    } | null

    if (!streakData?.reviewStreak) {
      return {
        userId,
        currentStreak: 0,
        longestStreak: 0,
        lastReviewDate: null,
        totalOnTimeReviews: 0,
        streakMultiplier: 1.0
      }
    }

    const currentStreak = streakData.reviewStreak.current || 0
    const streakMultiplier = Math.min(
      1.0 + currentStreak * STREAK_MULTIPLIER_INCREMENT,
      MAX_STREAK_MULTIPLIER
    )

    return {
      userId,
      currentStreak,
      longestStreak: streakData.reviewStreak.longest || 0,
      lastReviewDate: streakData.reviewStreak.lastReviewDate
        ? new Date(streakData.reviewStreak.lastReviewDate)
        : null,
      totalOnTimeReviews: streakData.reviewStreak.totalOnTime || 0,
      streakMultiplier
    }
  } catch (error) {
    console.error('Error getting review streak:', error)
    return {
      userId,
      currentStreak: 0,
      longestStreak: 0,
      lastReviewDate: null,
      totalOnTimeReviews: 0,
      streakMultiplier: 1.0
    }
  }
}

export async function updateReviewStreak(
  userId: number,
  jobId: number
): Promise<{
  newStreak: number
  xpBonus: number
  streakBroken: boolean
  milestoneReached: boolean
}> {
  try {
    // Get the job completion date
    const [job] = await db
      .select()
      .from(jobPostings)
      .where(eq(jobPostings.id, jobId))
      .limit(1)

    if (!job || !job.completedAt) {
      return {
        newStreak: 0,
        xpBonus: 0,
        streakBroken: false,
        milestoneReached: false
      }
    }

    const reviewSubmittedAt = new Date()
    const daysSinceCompletion = Math.floor(
      (reviewSubmittedAt.getTime() - job.completedAt.getTime()) /
        (1000 * 60 * 60 * 24)
    )

    // Check if review was submitted within the streak window
    const isOnTime = daysSinceCompletion <= STREAK_WINDOW_DAYS

    // Get current streak data
    const currentStreakData = await getReviewStreak(userId)

    let newStreak = currentStreakData.currentStreak
    let streakBroken = false
    let xpBonus = 0

    if (isOnTime) {
      // Check if streak should continue or start fresh
      if (currentStreakData.lastReviewDate) {
        const daysSinceLastReview = Math.floor(
          (reviewSubmittedAt.getTime() -
            currentStreakData.lastReviewDate.getTime()) /
            (1000 * 60 * 60 * 24)
        )

        if (daysSinceLastReview <= STREAK_WINDOW_DAYS * 2) {
          // Continue streak
          newStreak = currentStreakData.currentStreak + 1
        } else {
          // Streak broken, start new
          streakBroken = true
          newStreak = 1
        }
      } else {
        // First review, start streak
        newStreak = 1
      }

      // Calculate XP bonus based on streak
      const multiplier = Math.min(
        1.0 + newStreak * STREAK_MULTIPLIER_INCREMENT,
        MAX_STREAK_MULTIPLIER
      )
      xpBonus = Math.floor(BASE_STREAK_XP * multiplier)
    } else {
      // Review not on time, streak broken
      streakBroken = currentStreakData.currentStreak > 0
      newStreak = 0
    }

    // Update user's game data
    const [userData] = await db
      .select()
      .from(userGameData)
      .where(eq(userGameData.userId, userId))
      .limit(1)

    const currentStats = (userData?.stats || {}) as any
    const longestStreak = Math.max(newStreak, currentStreakData.longestStreak)

    const updatedStats = {
      ...currentStats,
      reviewStreak: {
        current: newStreak,
        longest: longestStreak,
        lastReviewDate: isOnTime
          ? reviewSubmittedAt.toISOString()
          : currentStreakData.lastReviewDate,
        totalOnTime: currentStreakData.totalOnTimeReviews + (isOnTime ? 1 : 0)
      }
    }

    await db
      .update(userGameData)
      .set({
        stats: updatedStats,
        updatedAt: new Date()
      })
      .where(eq(userGameData.userId, userId))

    // Award XP bonus if earned
    if (xpBonus > 0) {
      const rewardsService = new RewardsService()
      await rewardsService.addXP(
        userId,
        xpBonus,
        `Review streak bonus (${newStreak} reviews)`
      )
    }

    // Check for streak milestones
    const milestoneReached = checkStreakMilestone(newStreak)
    if (milestoneReached) {
      await awardStreakMilestone(userId, newStreak)
    }

    return {
      newStreak,
      xpBonus,
      streakBroken,
      milestoneReached
    }
  } catch (error) {
    console.error('Error updating review streak:', error)
    return {
      newStreak: 0,
      xpBonus: 0,
      streakBroken: false,
      milestoneReached: false
    }
  }
}

function checkStreakMilestone(streak: number): boolean {
  // Milestones at 3, 7, 14, 30, 50, 100 reviews
  const milestones = [3, 7, 14, 30, 50, 100]
  return milestones.includes(streak)
}

async function awardStreakMilestone(userId: number, streak: number) {
  const milestoneRewards: Record<number, { xp: number; achievement: string }> =
    {
      3: { xp: 50, achievement: 'review_streak_3' },
      7: { xp: 100, achievement: 'review_streak_7' },
      14: { xp: 200, achievement: 'review_streak_14' },
      30: { xp: 500, achievement: 'review_streak_30' },
      50: { xp: 1000, achievement: 'review_streak_50' },
      100: { xp: 2500, achievement: 'review_streak_100' }
    }

  const reward = milestoneRewards[streak]
  if (reward) {
    const rewardsService = new RewardsService()
    await rewardsService.addXP(
      userId,
      reward.xp,
      `Milestone: ${streak}-review streak!`
    )

    await checkAndAwardAchievements(userId, reward.achievement)
  }
}

export async function getTopReviewers(limit: number = 10): Promise<
  Array<{
    userId: number
    name: string | null
    currentStreak: number
    longestStreak: number
    totalReviews: number
    level: number
  }>
> {
  try {
    // Get users with review streaks
    const usersWithStreaks = await db
      .select({
        user: users,
        gameData: userGameData
      })
      .from(users)
      .leftJoin(userGameData, eq(users.id, userGameData.userId))
      .limit(limit * 2) // Get more to filter

    // Process and sort by streak
    const reviewers = await Promise.all(
      usersWithStreaks.map(async ({ user, gameData }) => {
        const stats = (gameData?.stats || {}) as any
        const reviewStreak = stats.reviewStreak || {}

        // Count total reviews
        const [freelancerReviewCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(freelancerReviews)
          .where(eq(freelancerReviews.reviewerId, user.id))

        const [clientReviewCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(clientReviews)
          .where(eq(clientReviews.reviewerId, user.id))

        const totalReviews =
          (freelancerReviewCount?.count || 0) + (clientReviewCount?.count || 0)

        return {
          userId: user.id,
          name: user.name,
          currentStreak: reviewStreak.current || 0,
          longestStreak: reviewStreak.longest || 0,
          totalReviews,
          level: gameData?.level || 1
        }
      })
    )

    // Sort by current streak, then by total reviews
    return reviewers
      .sort((a, b) => {
        if (b.currentStreak !== a.currentStreak) {
          return b.currentStreak - a.currentStreak
        }
        return b.totalReviews - a.totalReviews
      })
      .slice(0, limit)
  } catch (error) {
    console.error('Error getting top reviewers:', error)
    return []
  }
}

export async function checkAndNotifyStreakAtRisk(
  userId: number
): Promise<boolean> {
  try {
    const streak = await getReviewStreak(userId)

    if (streak.currentStreak === 0 || !streak.lastReviewDate) {
      return false
    }

    const daysSinceLastReview = Math.floor(
      (Date.now() - streak.lastReviewDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Notify if streak is at risk (5+ days since last review)
    const isAtRisk =
      daysSinceLastReview >= 5 && daysSinceLastReview < STREAK_WINDOW_DAYS * 2

    if (isAtRisk) {
      // In production, send notification to user
      console.log(
        `User ${userId} review streak at risk - ${daysSinceLastReview} days since last review`
      )
    }

    return isAtRisk
  } catch (error) {
    console.error('Error checking streak risk:', error)
    return false
  }
}
