import { NextRequest, NextResponse } from 'next/server'

import { and, desc, eq, sql } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import {
  getEarningsByPeriod,
  getEarningsStatistics,
  getFreelancerEarningsSummary,
  getUpcomingPayments
} from '@/lib/db/queries/earnings'
import { getFreelancerProfileByUserId } from '@/lib/db/queries/freelancers'
import {
  freelancerReviews,
  jobBids,
  jobMilestones,
  jobPostings
} from '@/lib/db/schema'
import { getUser } from '@/services/user'

// GET /api/freelancers/[id]/dashboard - Get comprehensive dashboard data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const freelancerId = parseInt(id)

    if (isNaN(freelancerId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid freelancer ID' },
        { status: 400 }
      )
    }

    // Check if user is authorized
    const user = await getUser()
    if (!user || user.id !== freelancerId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get freelancer profile
    const profile = await getFreelancerProfileByUserId(freelancerId)
    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Freelancer profile not found' },
        { status: 404 }
      )
    }

    // Use the actual profile ID for queries, not the user ID
    const profileId = profile.id

    // Get earnings summary
    const earningsSummary = await getFreelancerEarningsSummary(freelancerId)

    // Get earnings statistics
    const earningsStats = await getEarningsStatistics(freelancerId)

    // Get recent earnings (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentEarnings = await getEarningsByPeriod(
      freelancerId,
      'daily',
      thirtyDaysAgo,
      new Date()
    )

    // Get upcoming payments
    const upcomingPayments = await getUpcomingPayments(freelancerId)

    // Get active jobs
    const activeJobs = await db
      .select({
        id: jobPostings.id,
        title: jobPostings.title,
        status: jobPostings.status,
        clientName: sql<string>`(SELECT name FROM users WHERE id = ${jobPostings.clientId})`,
        totalMilestones: sql<number>`(SELECT COUNT(*) FROM ${jobMilestones} WHERE job_id = ${jobPostings.id})`,
        completedMilestones: sql<number>`(SELECT COUNT(*) FROM ${jobMilestones} WHERE job_id = ${jobPostings.id} AND status = 'approved')`,
        nextMilestone: sql<string>`(SELECT title FROM ${jobMilestones} WHERE job_id = ${jobPostings.id} AND status IN ('pending', 'in_progress') ORDER BY due_date ASC LIMIT 1)`,
        nextMilestoneDate: sql<Date>`(SELECT due_date FROM ${jobMilestones} WHERE job_id = ${jobPostings.id} AND status IN ('pending', 'in_progress') ORDER BY due_date ASC LIMIT 1)`
      })
      .from(jobPostings)
      .where(
        and(
          eq(jobPostings.freelancerId, profileId),
          sql`${jobPostings.status} IN ('in_progress', 'active')`
        )
      )
      .orderBy(desc(jobPostings.updatedAt))
      .limit(5)

    // Get recent proposals
    const recentProposals = await db
      .select({
        id: jobBids.id,
        jobId: jobBids.jobId,
        jobTitle: sql<string>`(SELECT title FROM ${jobPostings} WHERE id = ${jobBids.jobId})`,
        bidAmount: jobBids.bidAmount,
        status: jobBids.status,
        createdAt: jobBids.createdAt,
        clientName: sql<string>`(SELECT u.name FROM users u INNER JOIN ${jobPostings} j ON u.id = j.client_id WHERE j.id = ${jobBids.jobId})`
      })
      .from(jobBids)
      .where(eq(jobBids.freelancerId, profileId))
      .orderBy(desc(jobBids.createdAt))
      .limit(5)

    // Get proposal statistics
    const [proposalStats] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        pending: sql<number>`COUNT(*) FILTER (WHERE status = 'pending')`,
        shortlisted: sql<number>`COUNT(*) FILTER (WHERE status = 'shortlisted')`,
        accepted: sql<number>`COUNT(*) FILTER (WHERE status = 'accepted')`,
        rejected: sql<number>`COUNT(*) FILTER (WHERE status = 'rejected')`
      })
      .from(jobBids)
      .where(eq(jobBids.freelancerId, profileId))

    // Calculate conversion rate
    const totalCompleted =
      Number(proposalStats?.accepted || 0) +
      Number(proposalStats?.rejected || 0)
    const conversionRate =
      totalCompleted > 0
        ? (Number(proposalStats?.accepted || 0) / totalCompleted) * 100
        : 0

    // Get recent reviews
    const recentReviews = await db
      .select({
        id: freelancerReviews.id,
        rating: freelancerReviews.rating,
        reviewText: freelancerReviews.reviewText,
        clientName: sql<string>`(SELECT name FROM users WHERE id = ${freelancerReviews.reviewerId})`,
        createdAt: freelancerReviews.createdAt
      })
      .from(freelancerReviews)
      .where(eq(freelancerReviews.freelancerId, profile.id))
      .orderBy(desc(freelancerReviews.createdAt))
      .limit(3)

    // Get skill performance (most used skills in accepted jobs)
    // Simplified query to avoid GROUP BY issues
    const skillPerformance = await db
      .select({
        skill: sql<string>`skill_name`,
        projectCount: sql<number>`COUNT(*)::int`
      })
      .from(
        sql`(
          SELECT DISTINCT
            jsonb_array_elements_text(${jobPostings.skillsRequired}) as skill_name,
            ${jobPostings.id} as job_id
          FROM ${jobPostings}
          WHERE ${jobPostings.freelancerId} = ${profileId}
            AND ${jobPostings.status} = 'completed'
        ) as job_skills`
      )
      .groupBy(sql`skill_name`)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(5)

    // Get completion rate
    const [completionStats] = await db
      .select({
        totalJobs: sql<number>`COUNT(*)`,
        completedJobs: sql<number>`COUNT(*) FILTER (WHERE status = 'completed')`
      })
      .from(jobPostings)
      .where(eq(jobPostings.freelancerId, profileId))

    const completionRate =
      Number(completionStats?.totalJobs) > 0
        ? (Number(completionStats?.completedJobs) /
            Number(completionStats?.totalJobs)) *
          100
        : 0

    // Get milestone statistics
    const [milestoneStats] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        pending: sql<number>`COUNT(*) FILTER (WHERE ${jobMilestones.status} = 'pending')`,
        inProgress: sql<number>`COUNT(*) FILTER (WHERE ${jobMilestones.status} = 'in_progress')`,
        submitted: sql<number>`COUNT(*) FILTER (WHERE ${jobMilestones.status} = 'submitted')`,
        approved: sql<number>`COUNT(*) FILTER (WHERE ${jobMilestones.status} = 'approved')`,
        disputed: sql<number>`COUNT(*) FILTER (WHERE ${jobMilestones.status} = 'disputed')`
      })
      .from(jobMilestones)
      .innerJoin(jobPostings, eq(jobMilestones.jobId, jobPostings.id))
      .where(eq(jobPostings.freelancerId, profileId))

    // Get client diversity (unique clients)
    const [clientStats] = await db
      .select({
        uniqueClients: sql<number>`COUNT(DISTINCT client_id)`,
        repeatClients: sql<number>`COUNT(DISTINCT client_id) FILTER (WHERE client_job_count > 1)`
      })
      .from(
        sql`(
          SELECT client_id, COUNT(*) as client_job_count
          FROM ${jobPostings}
          WHERE freelancer_id = ${profileId}
          GROUP BY client_id
        ) as client_jobs`
      )

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          id: profile.id,
          userId: profile.userId,
          professionalTitle: profile.professionalTitle,
          availability: profile.availability,
          avgRating: profile.avgRating,
          completionRate: profile.completionRate,
          totalJobs: profile.totalJobs,
          verificationStatus: profile.verificationStatus
        },
        earnings: {
          summary: earningsSummary,
          statistics: earningsStats,
          recentEarnings,
          upcomingPayments: upcomingPayments.slice(0, 5)
        },
        jobs: {
          active: activeJobs,
          completionRate: Math.round(completionRate),
          milestoneStats: {
            total: Number(milestoneStats?.total) || 0,
            pending: Number(milestoneStats?.pending) || 0,
            inProgress: Number(milestoneStats?.inProgress) || 0,
            submitted: Number(milestoneStats?.submitted) || 0,
            approved: Number(milestoneStats?.approved) || 0,
            disputed: Number(milestoneStats?.disputed) || 0
          }
        },
        proposals: {
          recent: recentProposals,
          stats: {
            total: Number(proposalStats?.total) || 0,
            pending: Number(proposalStats?.pending) || 0,
            shortlisted: Number(proposalStats?.shortlisted) || 0,
            accepted: Number(proposalStats?.accepted) || 0,
            rejected: Number(proposalStats?.rejected) || 0,
            conversionRate: Math.round(conversionRate)
          }
        },
        reviews: {
          recent: recentReviews,
          avgRating: profile.avgRating,
          totalReviews: profile.reviewCount
        },
        performance: {
          skillPerformance,
          completionRate: Math.round(completionRate),
          responseTime: profile.responseTime,
          uniqueClients: Number(clientStats?.uniqueClients) || 0,
          repeatClients: Number(clientStats?.repeatClients) || 0
        },
        quickStats: {
          totalEarnings: earningsSummary.totalEarnings,
          availableBalance: earningsSummary.availableBalance,
          activeJobs: activeJobs.length,
          pendingProposals: Number(proposalStats?.pending) || 0,
          monthlyGrowth: earningsStats.growthRate
        }
      }
    })
  } catch (error) {
    console.error('Error fetching freelancer dashboard data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
