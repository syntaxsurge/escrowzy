import 'server-only'

import { eq, and, sql } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { userHasAchievement } from '@/lib/db/queries/achievements'
import { jobPostings, jobMilestones } from '@/lib/db/schema'

import { checkAndAwardAchievements } from './achievement-triggers'

/**
 * Check and award milestone achievements when a job is completed
 */
export async function checkJobCompletionAchievements(
  userId: number,
  isFreelancer: boolean = true
): Promise<string[]> {
  const awardedAchievements: string[] = []

  try {
    // Trigger achievement check for job completion
    const achievements = await checkAndAwardAchievements(
      userId,
      isFreelancer ? 'job_completed' : 'milestone_completed'
    )

    awardedAchievements.push(...achievements)

    // Log achievement awards
    if (awardedAchievements.length > 0) {
      console.log(
        `Awarded ${awardedAchievements.length} achievements to user ${userId}:`,
        awardedAchievements
      )
    }
  } catch (error) {
    console.error('Error checking job completion achievements:', error)
  }

  return awardedAchievements
}

/**
 * Check and award milestone achievements when a milestone is completed
 */
export async function checkMilestoneCompletionAchievements(
  userId: number,
  milestoneId: number
): Promise<string[]> {
  const awardedAchievements: string[] = []

  try {
    // Get milestone details
    const [milestone] = await db
      .select()
      .from(jobMilestones)
      .where(eq(jobMilestones.id, milestoneId))
      .limit(1)

    if (!milestone) {
      return awardedAchievements
    }

    // Get job details
    const [job] = await db
      .select()
      .from(jobPostings)
      .where(eq(jobPostings.id, milestone.jobId))
      .limit(1)

    if (!job) {
      return awardedAchievements
    }

    // Check if this is the final milestone
    const [milestoneStats] = await db
      .select({
        total: sql<number>`count(*)`,
        completed: sql<number>`sum(case when status = 'approved' then 1 else 0 end)`
      })
      .from(jobMilestones)
      .where(eq(jobMilestones.jobId, milestone.jobId))

    const isJobComplete = milestoneStats.total === milestoneStats.completed

    // If job is complete, check for job completion achievements
    if (isJobComplete) {
      const freelancerId = job.freelancerId
      if (freelancerId) {
        const achievements = await checkJobCompletionAchievements(
          freelancerId,
          true
        )
        awardedAchievements.push(...achievements)
      }
    }

    // Always check for milestone-specific achievements
    const achievements = await checkAndAwardAchievements(
      userId,
      'milestone_completed'
    )
    awardedAchievements.push(...achievements)
  } catch (error) {
    console.error('Error checking milestone completion achievements:', error)
  }

  return awardedAchievements
}

/**
 * Get progress towards next milestone achievement
 */
export async function getMilestoneProgress(userId: number): Promise<{
  currentJobs: number
  nextMilestone: number
  nextAchievementId: string | null
  progress: number
}> {
  try {
    // Get current job count
    const [stats] = await db
      .select({
        completedJobs: sql<number>`count(*)`
      })
      .from(jobPostings)
      .where(
        and(
          eq(jobPostings.freelancerId, userId),
          eq(jobPostings.status, 'completed')
        )
      )

    const currentJobs = Number(stats?.completedJobs || 0)

    // Define milestones
    const milestones = [
      { count: 1, id: 'FIRST_JOB' },
      { count: 10, id: 'JOB_MILESTONE_10' },
      { count: 50, id: 'JOB_MILESTONE_50' },
      { count: 100, id: 'JOB_MILESTONE_100' }
    ]

    // Find next unclaimed milestone
    for (const milestone of milestones) {
      const hasAchievement = await userHasAchievement(userId, milestone.id)
      if (!hasAchievement && currentJobs < milestone.count) {
        return {
          currentJobs,
          nextMilestone: milestone.count,
          nextAchievementId: milestone.id,
          progress: Math.round((currentJobs / milestone.count) * 100)
        }
      }
    }

    // All milestones completed
    return {
      currentJobs,
      nextMilestone: 0,
      nextAchievementId: null,
      progress: 100
    }
  } catch (error) {
    console.error('Error getting milestone progress:', error)
    return {
      currentJobs: 0,
      nextMilestone: 1,
      nextAchievementId: 'FIRST_JOB',
      progress: 0
    }
  }
}

/**
 * Get earnings milestone progress
 */
export async function getEarningsProgress(userId: number): Promise<{
  currentEarnings: number
  nextMilestone: number
  nextAchievementId: string | null
  progress: number
}> {
  try {
    // Get current earnings
    const { getFreelancerStats } = await import('@/lib/db/queries/freelancers')
    const stats = await getFreelancerStats(userId)
    const currentEarnings = parseFloat(stats.totalEarnings)

    // Define milestones
    const milestones = [
      { amount: 1000, id: 'EARNINGS_MILESTONE_1K' },
      { amount: 10000, id: 'EARNINGS_MILESTONE_10K' },
      { amount: 100000, id: 'EARNINGS_MILESTONE_100K' }
    ]

    // Find next unclaimed milestone
    for (const milestone of milestones) {
      const hasAchievement = await userHasAchievement(userId, milestone.id)
      if (!hasAchievement && currentEarnings < milestone.amount) {
        return {
          currentEarnings,
          nextMilestone: milestone.amount,
          nextAchievementId: milestone.id,
          progress: Math.round((currentEarnings / milestone.amount) * 100)
        }
      }
    }

    // All milestones completed
    return {
      currentEarnings,
      nextMilestone: 0,
      nextAchievementId: null,
      progress: 100
    }
  } catch (error) {
    console.error('Error getting earnings progress:', error)
    return {
      currentEarnings: 0,
      nextMilestone: 1000,
      nextAchievementId: 'EARNINGS_MILESTONE_1K',
      progress: 0
    }
  }
}
