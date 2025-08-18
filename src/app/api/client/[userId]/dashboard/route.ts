import 'server-only'

import { NextRequest, NextResponse } from 'next/server'

import { and, count, desc, eq, gte, sql } from 'drizzle-orm'

import { withAuth } from '@/lib/api/auth-middleware'
import { db } from '@/lib/db/drizzle'
import {
  freelancerProfiles,
  jobBids,
  jobMilestones,
  jobPostings,
  users
} from '@/lib/db/schema'

interface ClientDashboardData {
  overview: {
    activeJobs: number
    totalSpent: number
    avgProjectCost: number
    totalHires: number
    pendingPayments: number
    inProgressMilestones: number
    completedProjects: number
    avgCompletionTime: number
  }
  jobs: {
    posted: Array<{
      id: number
      title: string
      status: string
      category: string
      budget: string
      proposalsCount: number
      createdAt: Date
      deadline: Date | null
    }>
    active: Array<{
      id: number
      title: string
      freelancerName: string
      freelancerId: number
      progress: number
      nextMilestone: string | null
      nextMilestoneDate: Date | null
      totalBudget: string
    }>
  }
  milestones: {
    upcoming: Array<{
      id: number
      jobId: number
      jobTitle: string
      title: string
      amount: string
      dueDate: Date | null
      status: string
      freelancerName: string
    }>
    stats: {
      total: number
      pending: number
      inProgress: number
      submitted: number
      approved: number
      disputed: number
    }
  }
  freelancers: {
    active: Array<{
      id: number
      name: string
      title: string | null
      activeJobs: number
      totalPaid: number
      avgRating: number
      completionRate: number
    }>
    topPerformers: Array<{
      id: number
      name: string
      title: string | null
      completedJobs: number
      totalEarned: number
      avgRating: number
      specialties: string[]
    }>
  }
  spending: {
    monthly: Array<{
      month: string
      amount: number
      projectCount: number
    }>
    byCategory: Array<{
      category: string
      amount: number
      percentage: number
    }>
    projections: {
      currentMonth: number
      nextMonth: number
      quarterEstimate: number
    }
  }
  applications: {
    recent: Array<{
      id: number
      jobId: number
      jobTitle: string
      freelancerId: number
      freelancerName: string
      bidAmount: string
      proposalText: string
      deliveryDays: number
      status: string
      createdAt: Date
    }>
    stats: {
      total: number
      pending: number
      shortlisted: number
      hired: number
    }
  }
  teamActivity: {
    recentActions: Array<{
      type: string
      description: string
      actor: string
      timestamp: Date
    }>
    memberStats: Array<{
      id: number
      name: string
      role: string
      activeProjects: number
      totalManaged: number
    }>
  }
}

export const GET = withAuth(
  async (
    request: NextRequest,
    context: { session: any; params?: { userId: string } }
  ) => {
    try {
      const clientId = parseInt(context.params?.userId || '0')

      // Get client's posted jobs
      const postedJobs = await db
        .select({
          id: jobPostings.id,
          title: jobPostings.title,
          status: jobPostings.status,
          category: jobPostings.categoryId,
          budgetMin: jobPostings.budgetMin,
          budgetMax: jobPostings.budgetMax,
          budgetType: jobPostings.budgetType,
          deadline: jobPostings.deadline,
          createdAt: jobPostings.createdAt
        })
        .from(jobPostings)
        .where(eq(jobPostings.clientId, clientId))
        .orderBy(desc(jobPostings.createdAt))
        .limit(10)

      // Get job IDs for further queries
      const jobIds = postedJobs.map(job => job.id)

      // Count proposals for each job
      const proposalCounts = jobIds.length
        ? await db
            .select({
              jobId: jobBids.jobId,
              count: count()
            })
            .from(jobBids)
            .where(sql`${jobBids.jobId} IN ${jobIds}`)
            .groupBy(jobBids.jobId)
        : []

      const proposalCountMap = Object.fromEntries(
        proposalCounts.map(p => [p.jobId, p.count])
      )

      // Get active jobs with freelancer info
      const activeJobsQuery = await db
        .select({
          job: jobPostings,
          freelancer: users,
          bid: jobBids
        })
        .from(jobPostings)
        .innerJoin(
          jobBids,
          and(eq(jobBids.jobId, jobPostings.id), eq(jobBids.status, 'accepted'))
        )
        .innerJoin(users, eq(users.id, jobBids.freelancerId))
        .where(
          and(
            eq(jobPostings.clientId, clientId),
            eq(jobPostings.status, 'in_progress')
          )
        )
        .limit(10)

      // Get milestone statistics
      const milestoneStatsQuery = jobIds.length
        ? await db
            .select({
              status: jobMilestones.status,
              count: count()
            })
            .from(jobMilestones)
            .where(sql`${jobMilestones.jobId} IN ${jobIds}`)
            .groupBy(jobMilestones.status)
        : []

      const milestoneStats = {
        total: 0,
        pending: 0,
        inProgress: 0,
        submitted: 0,
        approved: 0,
        disputed: 0
      }

      milestoneStatsQuery.forEach(stat => {
        milestoneStats.total += stat.count
        switch (stat.status) {
          case 'pending':
            milestoneStats.pending = stat.count
            break
          case 'in_progress':
            milestoneStats.inProgress = stat.count
            break
          case 'submitted':
            milestoneStats.submitted = stat.count
            break
          case 'approved':
            milestoneStats.approved = stat.count
            break
          case 'disputed':
            milestoneStats.disputed = stat.count
            break
        }
      })

      // Get upcoming milestones
      const upcomingMilestones = jobIds.length
        ? await db
            .select({
              milestone: jobMilestones,
              job: jobPostings,
              freelancer: users
            })
            .from(jobMilestones)
            .innerJoin(jobPostings, eq(jobPostings.id, jobMilestones.jobId))
            .innerJoin(
              jobBids,
              and(
                eq(jobBids.jobId, jobPostings.id),
                eq(jobBids.status, 'accepted')
              )
            )
            .innerJoin(users, eq(users.id, jobBids.freelancerId))
            .where(
              and(
                sql`${jobMilestones.jobId} IN ${jobIds}`,
                sql`${jobMilestones.status} IN ('pending', 'in_progress', 'submitted')`
              )
            )
            .orderBy(jobMilestones.dueDate)
            .limit(5)
        : []

      // Get recent applications/bids
      const recentApplications = jobIds.length
        ? await db
            .select({
              bid: jobBids,
              job: jobPostings,
              freelancer: users,
              profile: freelancerProfiles
            })
            .from(jobBids)
            .innerJoin(jobPostings, eq(jobPostings.id, jobBids.jobId))
            .innerJoin(users, eq(users.id, jobBids.freelancerId))
            .leftJoin(
              freelancerProfiles,
              eq(freelancerProfiles.userId, users.id)
            )
            .where(sql`${jobBids.jobId} IN ${jobIds}`)
            .orderBy(desc(jobBids.createdAt))
            .limit(10)
        : []

      // Get spending analytics (last 6 months)
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      const monthlySpending = await db
        .select({
          month: sql<string>`TO_CHAR(${jobMilestones.createdAt}, 'YYYY-MM')`,
          amount: sql<number>`SUM(CAST(${jobMilestones.amount} AS DECIMAL))`,
          count: count()
        })
        .from(jobMilestones)
        .innerJoin(jobPostings, eq(jobPostings.id, jobMilestones.jobId))
        .where(
          and(
            eq(jobPostings.clientId, clientId),
            eq(jobMilestones.status, 'approved'),
            gte(jobMilestones.createdAt, sixMonthsAgo)
          )
        )
        .groupBy(sql`TO_CHAR(${jobMilestones.createdAt}, 'YYYY-MM')`)
        .orderBy(sql`TO_CHAR(${jobMilestones.createdAt}, 'YYYY-MM')`)

      // Get active freelancers
      const activeFreelancers = await db
        .select({
          freelancer: users,
          profile: freelancerProfiles,
          activeJobs: sql<number>`COUNT(DISTINCT ${jobBids.jobId})`,
          totalPaid: sql<number>`COALESCE(SUM(CASE WHEN ${jobMilestones.status} = 'approved' THEN CAST(${jobMilestones.amount} AS DECIMAL) ELSE 0 END), 0)`
        })
        .from(jobBids)
        .innerJoin(users, eq(users.id, jobBids.freelancerId))
        .leftJoin(freelancerProfiles, eq(freelancerProfiles.userId, users.id))
        .innerJoin(jobPostings, eq(jobPostings.id, jobBids.jobId))
        .leftJoin(jobMilestones, eq(jobMilestones.jobId, jobPostings.id))
        .where(
          and(
            eq(jobPostings.clientId, clientId),
            eq(jobBids.status, 'accepted')
          )
        )
        .groupBy(users.id, freelancerProfiles.id)
        .limit(5)

      // Calculate overview statistics
      const totalSpentResult = await db
        .select({
          total: sql<number>`COALESCE(SUM(CAST(${jobMilestones.amount} AS DECIMAL)), 0)`
        })
        .from(jobMilestones)
        .innerJoin(jobPostings, eq(jobPostings.id, jobMilestones.jobId))
        .where(
          and(
            eq(jobPostings.clientId, clientId),
            eq(jobMilestones.status, 'approved')
          )
        )

      const totalSpent = totalSpentResult[0]?.total || 0

      const completedProjectsCount = await db
        .select({ count: count() })
        .from(jobPostings)
        .where(
          and(
            eq(jobPostings.clientId, clientId),
            eq(jobPostings.status, 'completed')
          )
        )

      const pendingPaymentsResult = await db
        .select({
          total: sql<number>`COALESCE(SUM(CAST(${jobMilestones.amount} AS DECIMAL)), 0)`
        })
        .from(jobMilestones)
        .innerJoin(jobPostings, eq(jobPostings.id, jobMilestones.jobId))
        .where(
          and(
            eq(jobPostings.clientId, clientId),
            sql`${jobMilestones.status} IN ('submitted', 'in_progress')`
          )
        )

      const pendingPayments = pendingPaymentsResult[0]?.total || 0

      // Format response data
      const dashboardData: ClientDashboardData = {
        overview: {
          activeJobs: activeJobsQuery.length,
          totalSpent,
          avgProjectCost: completedProjectsCount[0]?.count
            ? totalSpent / completedProjectsCount[0].count
            : 0,
          totalHires: activeFreelancers.length,
          pendingPayments,
          inProgressMilestones: milestoneStats.inProgress,
          completedProjects: completedProjectsCount[0]?.count || 0,
          avgCompletionTime: 0 // Would need to calculate from job timestamps
        },
        jobs: {
          posted: postedJobs.map(job => ({
            id: job.id,
            title: job.title,
            status: job.status,
            category: job.category?.toString() || 'General',
            budget:
              job.budgetType === 'fixed'
                ? `$${job.budgetMin} - $${job.budgetMax}`
                : `$${job.budgetMin}/hr`,
            proposalsCount: proposalCountMap[job.id] || 0,
            createdAt: job.createdAt,
            deadline: job.deadline
          })),
          active: activeJobsQuery.map(({ job, freelancer, bid }) => ({
            id: job.id,
            title: job.title,
            freelancerName: freelancer.name || 'Unknown',
            freelancerId: freelancer.id,
            progress: 0, // Calculate based on milestones
            nextMilestone: null,
            nextMilestoneDate: null,
            totalBudget: bid.bidAmount
          }))
        },
        milestones: {
          upcoming: upcomingMilestones.map(
            ({ milestone, job, freelancer }) => ({
              id: milestone.id,
              jobId: job.id,
              jobTitle: job.title,
              title: milestone.title,
              amount: milestone.amount,
              dueDate: milestone.dueDate,
              status: milestone.status,
              freelancerName: freelancer.name || 'Unknown'
            })
          ),
          stats: milestoneStats
        },
        freelancers: {
          active: activeFreelancers.map(
            ({ freelancer, profile, activeJobs, totalPaid }) => ({
              id: freelancer.id,
              name: freelancer.name || 'Unknown',
              title: profile?.professionalTitle || null,
              activeJobs: Number(activeJobs),
              totalPaid: Number(totalPaid),
              avgRating: 0, // Would need to calculate from reviews
              completionRate: 0 // Would need to calculate from job completions
            })
          ),
          topPerformers: [] // Would need more complex query
        },
        spending: {
          monthly: monthlySpending.map(month => ({
            month: month.month,
            amount: Number(month.amount),
            projectCount: month.count
          })),
          byCategory: [], // Would need to group by category
          projections: {
            currentMonth: 0,
            nextMonth: 0,
            quarterEstimate: 0
          }
        },
        applications: {
          recent: recentApplications.map(
            ({ bid, job, freelancer, profile }) => ({
              id: bid.id,
              jobId: job.id,
              jobTitle: job.title,
              freelancerId: freelancer.id,
              freelancerName: freelancer.name || 'Unknown',
              bidAmount: bid.bidAmount,
              proposalText: bid.proposalText || '',
              deliveryDays: bid.deliveryDays,
              status: bid.status,
              createdAt: bid.createdAt
            })
          ),
          stats: {
            total: recentApplications.length,
            pending: recentApplications.filter(a => a.bid.status === 'pending')
              .length,
            shortlisted: recentApplications.filter(
              a => a.bid.status === 'shortlisted'
            ).length,
            hired: recentApplications.filter(a => a.bid.status === 'accepted')
              .length
          }
        },
        teamActivity: {
          recentActions: [],
          memberStats: []
        }
      }

      return NextResponse.json({
        success: true,
        data: dashboardData
      })
    } catch (error) {
      console.error('Failed to fetch client dashboard data:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch dashboard data'
        },
        { status: 500 }
      )
    }
  }
)
