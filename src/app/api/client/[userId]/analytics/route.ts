import 'server-only'

import { NextRequest, NextResponse } from 'next/server'

import { and, count, desc, eq, gte, sql, sum } from 'drizzle-orm'

import { withAuth } from '@/lib/api/auth-middleware'
import { db } from '@/lib/db/drizzle'
import {
  jobBids,
  jobCategories,
  jobMilestones,
  jobPostings,
  users
} from '@/lib/db/schema'

interface SpendingAnalytics {
  totalSpent: number
  averageProjectCost: number
  totalProjects: number
  completedProjects: number
  cancelledProjects: number
  successRate: number
  monthlyTrend: Array<{
    month: string
    spent: number
    projects: number
    avgCost: number
  }>
  categoryBreakdown: Array<{
    category: string
    categoryId: number
    amount: number
    projects: number
    percentage: number
  }>
  freelancerCosts: Array<{
    freelancerId: number
    freelancerName: string
    totalPaid: number
    projects: number
    avgProjectCost: number
    lastProject: Date
  }>
  budgetUtilization: {
    underBudget: number
    onBudget: number
    overBudget: number
  }
  roi: {
    totalInvested: number
    completedValue: number
    returnRate: number
    avgTimeToComplete: number
  }
  forecast: {
    nextMonth: number
    nextQuarter: number
    yearEnd: number
    growthRate: number
  }
}

export const GET = withAuth(
  async (
    request: NextRequest,
    context: { session: any; params?: { userId: string } }
  ) => {
    try {
      const clientId = parseInt(context.params?.userId || '0')
      const { searchParams } = new URL(request.url)

      // Get date range from query params (default to last 12 months)
      const months = parseInt(searchParams.get('months') || '12')
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - months)

      // Get total spending
      const totalSpendingResult = await db
        .select({
          total: sum(sql`CAST(${jobMilestones.amount} AS DECIMAL)`),
          projectCount: count(sql`DISTINCT ${jobPostings.id}`)
        })
        .from(jobMilestones)
        .innerJoin(jobPostings, eq(jobPostings.id, jobMilestones.jobId))
        .where(
          and(
            eq(jobPostings.clientId, clientId),
            eq(jobMilestones.status, 'approved'),
            gte(jobMilestones.createdAt, startDate)
          )
        )

      const totalSpent = Number(totalSpendingResult[0]?.total || 0)
      const totalProjects = totalSpendingResult[0]?.projectCount || 0

      // Get project statistics
      const projectStats = await db
        .select({
          status: jobPostings.status,
          count: count()
        })
        .from(jobPostings)
        .where(
          and(
            eq(jobPostings.clientId, clientId),
            gte(jobPostings.createdAt, startDate)
          )
        )
        .groupBy(jobPostings.status)

      const completedProjects =
        projectStats.find(s => s.status === 'completed')?.count || 0
      const cancelledProjects =
        projectStats.find(s => s.status === 'cancelled')?.count || 0

      // Get monthly spending trend
      const monthlySpending = await db
        .select({
          month: sql<string>`TO_CHAR(${jobMilestones.createdAt}, 'YYYY-MM')`,
          spent: sum(sql`CAST(${jobMilestones.amount} AS DECIMAL)`),
          projects: count(sql`DISTINCT ${jobPostings.id}`)
        })
        .from(jobMilestones)
        .innerJoin(jobPostings, eq(jobPostings.id, jobMilestones.jobId))
        .where(
          and(
            eq(jobPostings.clientId, clientId),
            eq(jobMilestones.status, 'approved'),
            gte(jobMilestones.createdAt, startDate)
          )
        )
        .groupBy(sql`TO_CHAR(${jobMilestones.createdAt}, 'YYYY-MM')`)
        .orderBy(sql`TO_CHAR(${jobMilestones.createdAt}, 'YYYY-MM')`)

      // Get spending by category
      const categorySpending = await db
        .select({
          categoryId: jobPostings.categoryId,
          categoryName: jobCategories.name,
          amount: sum(sql`CAST(${jobMilestones.amount} AS DECIMAL)`),
          projects: count(sql`DISTINCT ${jobPostings.id}`)
        })
        .from(jobMilestones)
        .innerJoin(jobPostings, eq(jobPostings.id, jobMilestones.jobId))
        .leftJoin(jobCategories, eq(jobCategories.id, jobPostings.categoryId))
        .where(
          and(
            eq(jobPostings.clientId, clientId),
            eq(jobMilestones.status, 'approved'),
            gte(jobMilestones.createdAt, startDate)
          )
        )
        .groupBy(jobPostings.categoryId, jobCategories.name)
        .orderBy(desc(sum(sql`CAST(${jobMilestones.amount} AS DECIMAL)`)))

      // Get freelancer costs
      const freelancerCosts = await db
        .select({
          freelancerId: jobBids.freelancerId,
          freelancerName: users.name,
          totalPaid: sum(sql`CAST(${jobMilestones.amount} AS DECIMAL)`),
          projects: count(sql`DISTINCT ${jobPostings.id}`),
          lastProject: sql<Date>`MAX(${jobMilestones.createdAt})`
        })
        .from(jobMilestones)
        .innerJoin(jobPostings, eq(jobPostings.id, jobMilestones.jobId))
        .innerJoin(
          jobBids,
          and(eq(jobBids.jobId, jobPostings.id), eq(jobBids.status, 'accepted'))
        )
        .innerJoin(users, eq(users.id, jobBids.freelancerId))
        .where(
          and(
            eq(jobPostings.clientId, clientId),
            eq(jobMilestones.status, 'approved'),
            gte(jobMilestones.createdAt, startDate)
          )
        )
        .groupBy(jobBids.freelancerId, users.name)
        .orderBy(desc(sum(sql`CAST(${jobMilestones.amount} AS DECIMAL)`)))
        .limit(10)

      // Calculate budget utilization
      const budgetUtilizationData = await db
        .select({
          jobId: jobPostings.id,
          budgetMin: jobPostings.budgetMin,
          budgetMax: jobPostings.budgetMax,
          actualSpent: sum(sql`CAST(${jobMilestones.amount} AS DECIMAL)`)
        })
        .from(jobPostings)
        .leftJoin(
          jobMilestones,
          and(
            eq(jobMilestones.jobId, jobPostings.id),
            eq(jobMilestones.status, 'approved')
          )
        )
        .where(
          and(
            eq(jobPostings.clientId, clientId),
            eq(jobPostings.status, 'completed'),
            gte(jobPostings.createdAt, startDate)
          )
        )
        .groupBy(jobPostings.id, jobPostings.budgetMin, jobPostings.budgetMax)

      let underBudget = 0
      let onBudget = 0
      let overBudget = 0

      budgetUtilizationData.forEach(job => {
        const spent = Number(job.actualSpent || 0)
        const budgetMin = Number(job.budgetMin || 0)
        const budgetMax = Number(job.budgetMax || 0)
        const budgetMid = (budgetMin + budgetMax) / 2
        const variance = budgetMid > 0 ? (spent - budgetMid) / budgetMid : 0

        if (variance < -0.1) underBudget++
        else if (variance > 0.1) overBudget++
        else onBudget++
      })

      // Calculate forecast based on trend
      const recentMonths = monthlySpending.slice(-3)
      const avgMonthlySpend =
        recentMonths.length > 0
          ? recentMonths.reduce((sum, m) => sum + Number(m.spent || 0), 0) /
            recentMonths.length
          : 0

      const previousMonths = monthlySpending.slice(-6, -3)
      const prevAvgSpend =
        previousMonths.length > 0
          ? previousMonths.reduce((sum, m) => sum + Number(m.spent || 0), 0) /
            previousMonths.length
          : 0

      const growthRate =
        prevAvgSpend > 0
          ? ((avgMonthlySpend - prevAvgSpend) / prevAvgSpend) * 100
          : 0

      // Format analytics response
      const analytics: SpendingAnalytics = {
        totalSpent,
        averageProjectCost: totalProjects > 0 ? totalSpent / totalProjects : 0,
        totalProjects,
        completedProjects,
        cancelledProjects,
        successRate:
          totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0,
        monthlyTrend: monthlySpending.map(month => ({
          month: month.month,
          spent: Number(month.spent || 0),
          projects: month.projects,
          avgCost:
            month.projects > 0 ? Number(month.spent || 0) / month.projects : 0
        })),
        categoryBreakdown: categorySpending.map(cat => ({
          category: cat.categoryName || 'Uncategorized',
          categoryId: cat.categoryId || 0,
          amount: Number(cat.amount || 0),
          projects: cat.projects,
          percentage:
            totalSpent > 0 ? (Number(cat.amount || 0) / totalSpent) * 100 : 0
        })),
        freelancerCosts: freelancerCosts.map(f => ({
          freelancerId: f.freelancerId,
          freelancerName: f.freelancerName || 'Unknown',
          totalPaid: Number(f.totalPaid || 0),
          projects: f.projects,
          avgProjectCost:
            f.projects > 0 ? Number(f.totalPaid || 0) / f.projects : 0,
          lastProject: f.lastProject
        })),
        budgetUtilization: {
          underBudget,
          onBudget,
          overBudget
        },
        roi: {
          totalInvested: totalSpent,
          completedValue:
            completedProjects *
            (totalProjects > 0 ? totalSpent / totalProjects : 0),
          returnRate: 0, // Would need business metrics to calculate actual ROI
          avgTimeToComplete: 0 // Would need to calculate from timestamps
        },
        forecast: {
          nextMonth: avgMonthlySpend * (1 + growthRate / 100),
          nextQuarter: avgMonthlySpend * 3 * (1 + growthRate / 100),
          yearEnd:
            avgMonthlySpend *
            (12 - new Date().getMonth()) *
            (1 + growthRate / 100),
          growthRate
        }
      }

      return NextResponse.json({
        success: true,
        data: analytics
      })
    } catch (error) {
      console.error('Failed to fetch client analytics:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch analytics data'
        },
        { status: 500 }
      )
    }
  }
)
