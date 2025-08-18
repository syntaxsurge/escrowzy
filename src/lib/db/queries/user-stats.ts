import 'server-only'

import { and, desc, eq, sql, count, avg, or, gte } from 'drizzle-orm'

import { db } from '../drizzle'
import {
  users,
  jobPostings,
  clientReviews,
  freelancerProfiles,
  trades
} from '../schema'

// Get client stats (for job details page)
export async function getClientStats(clientId: number) {
  // Get total jobs posted
  const [jobsPostedResult] = await db
    .select({ count: count() })
    .from(jobPostings)
    .where(eq(jobPostings.clientId, clientId))

  // Get hire rate (jobs with selected freelancer / total jobs)
  const [hireRateResult] = await db
    .select({
      total: count(),
      hired: sql<number>`COUNT(CASE WHEN ${jobPostings.freelancerId} IS NOT NULL THEN 1 END)`
    })
    .from(jobPostings)
    .where(
      and(
        eq(jobPostings.clientId, clientId),
        eq(jobPostings.status, 'completed')
      )
    )

  // Get average rating and review count
  const [ratingResult] = await db
    .select({
      avgRating: avg(clientReviews.rating),
      reviewCount: count()
    })
    .from(clientReviews)
    .where(eq(clientReviews.clientId, clientId))

  const hireRate =
    hireRateResult.total > 0
      ? Math.round((hireRateResult.hired / hireRateResult.total) * 100)
      : 0

  return {
    jobsPosted: jobsPostedResult.count,
    hireRate,
    avgRating: ratingResult.avgRating
      ? parseFloat(ratingResult.avgRating.toString()).toFixed(1)
      : '0.0',
    reviewCount: ratingResult.reviewCount
  }
}

// Get total active freelancers count
export async function getActiveFreelancersCount() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [result] = await db
    .select({ count: count() })
    .from(freelancerProfiles)
    .leftJoin(users, eq(freelancerProfiles.userId, users.id))
    .where(
      and(
        eq(freelancerProfiles.availability, 'available'),
        gte(users.updatedAt, thirtyDaysAgo)
      )
    )

  return result.count
}

// Get platform stats
export async function getPlatformStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Jobs posted today
  const [jobsToday] = await db
    .select({ count: count() })
    .from(jobPostings)
    .where(
      and(gte(jobPostings.createdAt, today), eq(jobPostings.status, 'open'))
    )

  // Active freelancers
  const activeFreelancers = await getActiveFreelancersCount()

  // Total open jobs
  const [openJobs] = await db
    .select({ count: count() })
    .from(jobPostings)
    .where(eq(jobPostings.status, 'open'))

  // Average budget
  const [avgBudget] = await db
    .select({
      avg: sql<number>`AVG(CAST(${jobPostings.budgetMin} AS DECIMAL))`
    })
    .from(jobPostings)
    .where(eq(jobPostings.status, 'open'))

  return {
    jobsPostedToday: jobsToday.count,
    activeFreelancers,
    openJobs: openJobs.count,
    averageBudget: avgBudget.avg ? Math.round(avgBudget.avg) : 0
  }
}

// Get freelancer platform statistics
export async function getFreelancerPlatformStats() {
  // Get total active freelancers
  const activeFreelancersCount = await getActiveFreelancersCount()

  // Get average rating of all freelancers
  const [avgRatingResult] = await db
    .select({
      avgRating: sql<number>`AVG(CAST(${freelancerProfiles.avgRating} AS DECIMAL) / 10)`
    })
    .from(freelancerProfiles)
    .where(sql`${freelancerProfiles.avgRating} > 0`)

  // Get average success rate (completion rate)
  const [avgSuccessRateResult] = await db
    .select({
      avgSuccessRate: avg(freelancerProfiles.completionRate)
    })
    .from(freelancerProfiles)

  // Get total freelancers registered
  const [totalFreelancersResult] = await db
    .select({ count: count() })
    .from(freelancerProfiles)

  return {
    activeFreelancers: activeFreelancersCount,
    totalFreelancers: totalFreelancersResult.count,
    averageRating: avgRatingResult.avgRating
      ? parseFloat(avgRatingResult.avgRating.toFixed(1))
      : 0,
    averageSuccessRate: avgSuccessRateResult.avgSuccessRate
      ? Math.round(parseFloat(avgSuccessRateResult.avgSuccessRate.toString()))
      : 0
  }
}

// Get user's location from profile or trades
export async function getUserLocation(userId: number): Promise<string | null> {
  // First check if user has location in their profile
  const [user] = await db
    .select({
      id: users.id,
      email: users.email
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  // For now, return null as users don't have metadata field
  // TODO: Add location field to users table or freelancer profiles

  // Try to infer from recent trades (payment methods might have country info)
  const [trade] = await db
    .select({
      id: trades.id
    })
    .from(trades)
    .where(or(eq(trades.sellerId, userId), eq(trades.buyerId, userId)))
    .orderBy(desc(trades.createdAt))
    .limit(1)

  // Payment method info not available in trades table
  // Return null for now

  return null
}
