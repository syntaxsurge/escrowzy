import 'server-only'

import { and, asc, between, desc, eq, gte, lte, sql } from 'drizzle-orm'

import { db } from '../drizzle'
import {
  earnings,
  jobMilestones,
  jobPostings,
  timeTracking,
  users,
  withdrawals
} from '../schema'

// Types
export interface EarningsSummary {
  totalEarnings: number
  availableBalance: number
  pendingEarnings: number
  withdrawnAmount: number
  platformFees: number
  netEarnings: number
}

export interface EarningsByPeriod {
  period: string
  amount: number
  count: number
  fees: number
  netAmount: number
}

export interface ClientEarnings {
  clientId: number
  clientName: string
  clientEmail: string | null
  totalEarnings: number
  projectCount: number
  averageProjectValue: number
  lastProjectDate: Date | null
}

export interface ProjectEarnings {
  jobId: number
  jobTitle: string
  clientName: string
  totalAmount: number
  paidAmount: number
  pendingAmount: number
  milestoneCount: number
  completedMilestones: number
  status: string
  startDate: Date
  completionDate: Date | null
}

export interface MilestonePayment {
  milestoneId: number
  milestoneTitle: string
  jobTitle: string
  amount: number
  paidAt: Date | null
  status: string
  clientName: string
}

// Get freelancer earnings summary
export async function getFreelancerEarningsSummary(
  freelancerId: number
): Promise<EarningsSummary> {
  // Get total earnings
  const [totalEarningsData] = await db
    .select({
      total: sql<number>`COALESCE(SUM(CAST(${earnings.amount} AS DECIMAL)), 0)`,
      fees: sql<number>`COALESCE(SUM(CAST(${earnings.platformFee} AS DECIMAL)), 0)`,
      net: sql<number>`COALESCE(SUM(CAST(${earnings.netAmount} AS DECIMAL)), 0)`
    })
    .from(earnings)
    .where(eq(earnings.freelancerId, freelancerId))

  // Get available balance
  const [availableData] = await db
    .select({
      available: sql<number>`COALESCE(SUM(CAST(${earnings.netAmount} AS DECIMAL)), 0)`
    })
    .from(earnings)
    .where(
      and(
        eq(earnings.freelancerId, freelancerId),
        eq(earnings.status, 'available'),
        lte(earnings.availableAt, new Date())
      )
    )

  // Get pending earnings
  const [pendingData] = await db
    .select({
      pending: sql<number>`COALESCE(SUM(CAST(${earnings.netAmount} AS DECIMAL)), 0)`
    })
    .from(earnings)
    .where(
      and(
        eq(earnings.freelancerId, freelancerId),
        eq(earnings.status, 'pending')
      )
    )

  // Get withdrawn amount
  const [withdrawnData] = await db
    .select({
      withdrawn: sql<number>`COALESCE(SUM(CAST(${withdrawals.amount} AS DECIMAL)), 0)`
    })
    .from(withdrawals)
    .where(
      and(
        eq(withdrawals.freelancerId, freelancerId),
        eq(withdrawals.status, 'completed')
      )
    )

  return {
    totalEarnings: Number(totalEarningsData?.total) || 0,
    availableBalance:
      (Number(availableData?.available) || 0) -
      (Number(withdrawnData?.withdrawn) || 0),
    pendingEarnings: Number(pendingData?.pending) || 0,
    withdrawnAmount: Number(withdrawnData?.withdrawn) || 0,
    platformFees: Number(totalEarningsData?.fees) || 0,
    netEarnings: Number(totalEarningsData?.net) || 0
  }
}

// Get earnings by period (daily, weekly, monthly, yearly)
export async function getEarningsByPeriod(
  freelancerId: number,
  period: 'daily' | 'weekly' | 'monthly' | 'yearly',
  startDate?: Date,
  endDate?: Date
): Promise<EarningsByPeriod[]> {
  const end = endDate || new Date()
  const start =
    startDate ||
    (() => {
      const date = new Date()
      switch (period) {
        case 'daily':
          date.setDate(date.getDate() - 30)
          break
        case 'weekly':
          date.setMonth(date.getMonth() - 3)
          break
        case 'monthly':
          date.setFullYear(date.getFullYear() - 1)
          break
        case 'yearly':
          date.setFullYear(date.getFullYear() - 5)
          break
      }
      return date
    })()

  let dateFormat: string
  switch (period) {
    case 'daily':
      dateFormat = 'YYYY-MM-DD'
      break
    case 'weekly':
      dateFormat = 'YYYY-IW'
      break
    case 'monthly':
      dateFormat = 'YYYY-MM'
      break
    case 'yearly':
      dateFormat = 'YYYY'
      break
  }

  const earningsData = await db
    .select({
      period: sql<string>`TO_CHAR(created_at, ${dateFormat})`,
      amount: sql<number>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)`,
      count: sql<number>`COUNT(*)::int`,
      fees: sql<number>`COALESCE(SUM(CAST(platform_fee AS DECIMAL)), 0)`,
      netAmount: sql<number>`COALESCE(SUM(CAST(net_amount AS DECIMAL)), 0)`
    })
    .from(earnings)
    .where(
      and(
        eq(earnings.freelancerId, freelancerId),
        between(earnings.createdAt, start, end)
      )
    )
    .groupBy(sql`TO_CHAR(created_at, ${dateFormat})`)
    .orderBy(sql`TO_CHAR(created_at, ${dateFormat})`)

  return earningsData.map(e => ({
    period: e.period,
    amount: Number(e.amount),
    count: Number(e.count),
    fees: Number(e.fees),
    netAmount: Number(e.netAmount)
  }))
}

// Get earnings by client
export async function getEarningsByClient(
  freelancerId: number,
  limit = 10
): Promise<ClientEarnings[]> {
  const clientEarnings = await db
    .select({
      clientId: users.id,
      clientName: users.name,
      clientEmail: users.email,
      totalEarnings: sql<number>`COALESCE(SUM(CAST(${earnings.netAmount} AS DECIMAL)), 0)`,
      projectCount: sql<number>`COUNT(DISTINCT ${jobPostings.id})`,
      lastProjectDate: sql<Date | null>`MAX(${earnings.createdAt})`
    })
    .from(earnings)
    .innerJoin(jobPostings, eq(earnings.jobId, jobPostings.id))
    .innerJoin(users, eq(jobPostings.clientId, users.id))
    .where(eq(earnings.freelancerId, freelancerId))
    .groupBy(users.id, users.name, users.email)
    .orderBy(
      desc(sql`COALESCE(SUM(CAST(${earnings.netAmount} AS DECIMAL)), 0)`)
    )
    .limit(limit)

  return clientEarnings.map(ce => ({
    clientId: ce.clientId,
    clientName: ce.clientName || 'Unknown Client',
    clientEmail: ce.clientEmail,
    totalEarnings: Number(ce.totalEarnings),
    projectCount: Number(ce.projectCount),
    averageProjectValue:
      Number(ce.projectCount) > 0
        ? Number(ce.totalEarnings) / Number(ce.projectCount)
        : 0,
    lastProjectDate: ce.lastProjectDate
  }))
}

// Get earnings by project
export async function getEarningsByProject(
  freelancerId: number,
  status?: 'all' | 'completed' | 'in_progress'
): Promise<ProjectEarnings[]> {
  const conditions = [eq(jobPostings.freelancerId, freelancerId)]

  if (status && status !== 'all') {
    conditions.push(
      eq(
        jobPostings.status,
        status === 'completed' ? 'completed' : 'in_progress'
      )
    )
  }

  const projects = await db
    .select({
      jobId: jobPostings.id,
      jobTitle: jobPostings.title,
      clientName: users.name,
      status: jobPostings.status,
      startDate: jobPostings.createdAt,
      completionDate: jobPostings.updatedAt,
      totalMilestones: sql<number>`(SELECT COUNT(*) FROM ${jobMilestones} WHERE ${jobMilestones.jobId} = ${jobPostings.id})`,
      completedMilestones: sql<number>`(SELECT COUNT(*) FROM ${jobMilestones} WHERE ${jobMilestones.jobId} = ${jobPostings.id} AND ${jobMilestones.status} = 'approved')`,
      totalAmount: sql<number>`COALESCE((SELECT SUM(CAST(${earnings.amount} AS DECIMAL)) FROM ${earnings} WHERE ${earnings.jobId} = ${jobPostings.id} AND ${earnings.freelancerId} = ${freelancerId}), 0)`,
      paidAmount: sql<number>`COALESCE((SELECT SUM(CAST(${earnings.netAmount} AS DECIMAL)) FROM ${earnings} WHERE ${earnings.jobId} = ${jobPostings.id} AND ${earnings.freelancerId} = ${freelancerId} AND ${earnings.status} = 'withdrawn'), 0)`,
      pendingAmount: sql<number>`COALESCE((SELECT SUM(CAST(${earnings.netAmount} AS DECIMAL)) FROM ${earnings} WHERE ${earnings.jobId} = ${jobPostings.id} AND ${earnings.freelancerId} = ${freelancerId} AND ${earnings.status} IN ('pending', 'available')), 0)`
    })
    .from(jobPostings)
    .innerJoin(users, eq(jobPostings.clientId, users.id))
    .where(and(...conditions))
    .orderBy(desc(jobPostings.createdAt))

  return projects.map(p => ({
    jobId: p.jobId,
    jobTitle: p.jobTitle,
    clientName: p.clientName || 'Unknown Client',
    totalAmount: Number(p.totalAmount),
    paidAmount: Number(p.paidAmount),
    pendingAmount: Number(p.pendingAmount),
    milestoneCount: Number(p.totalMilestones),
    completedMilestones: Number(p.completedMilestones),
    status: p.status,
    startDate: p.startDate,
    completionDate: p.status === 'completed' ? p.completionDate : null
  }))
}

// Get milestone payments
export async function getMilestonePayments(
  freelancerId: number,
  limit = 20
): Promise<MilestonePayment[]> {
  const payments = await db
    .select({
      milestoneId: jobMilestones.id,
      milestoneTitle: jobMilestones.title,
      jobTitle: jobPostings.title,
      amount: earnings.netAmount,
      paidAt: earnings.createdAt,
      status: earnings.status,
      clientName: users.name
    })
    .from(earnings)
    .innerJoin(jobMilestones, eq(earnings.milestoneId, jobMilestones.id))
    .innerJoin(jobPostings, eq(jobMilestones.jobId, jobPostings.id))
    .innerJoin(users, eq(jobPostings.clientId, users.id))
    .where(eq(earnings.freelancerId, freelancerId))
    .orderBy(desc(earnings.createdAt))
    .limit(limit)

  return payments.map(p => ({
    milestoneId: p.milestoneId!,
    milestoneTitle: p.milestoneTitle,
    jobTitle: p.jobTitle,
    amount: Number(p.amount),
    paidAt: p.paidAt,
    status: p.status,
    clientName: p.clientName || 'Unknown Client'
  }))
}

// Get earnings statistics
export async function getEarningsStatistics(freelancerId: number) {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [currentMonth] = await db
    .select({
      amount: sql<number>`COALESCE(SUM(CAST(${earnings.netAmount} AS DECIMAL)), 0)`
    })
    .from(earnings)
    .where(
      and(
        eq(earnings.freelancerId, freelancerId),
        gte(earnings.createdAt, thirtyDaysAgo)
      )
    )

  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  const [previousMonth] = await db
    .select({
      amount: sql<number>`COALESCE(SUM(CAST(${earnings.netAmount} AS DECIMAL)), 0)`
    })
    .from(earnings)
    .where(
      and(
        eq(earnings.freelancerId, freelancerId),
        between(earnings.createdAt, sixtyDaysAgo, thirtyDaysAgo)
      )
    )

  const currentMonthAmount = Number(currentMonth?.amount) || 0
  const previousMonthAmount = Number(previousMonth?.amount) || 0

  const growthRate =
    previousMonthAmount > 0
      ? ((currentMonthAmount - previousMonthAmount) / previousMonthAmount) * 100
      : currentMonthAmount > 0
        ? 100
        : 0

  // Get average project value
  const [avgProject] = await db
    .select({
      avgValue: sql<number>`AVG(project_totals.total)`,
      totalProjects: sql<number>`COUNT(*)::int`
    })
    .from(
      sql`(
        SELECT job_id, SUM(CAST(net_amount AS DECIMAL)) as total
        FROM earnings
        WHERE freelancer_id = ${freelancerId}
          AND job_id IS NOT NULL
        GROUP BY job_id
      ) as project_totals`
    )

  // Get time tracking stats if available
  const [timeStats] = await db
    .select({
      totalHours: sql<number>`COALESCE(SUM(${timeTracking.duration}) / 60.0, 0)`,
      billableHours: sql<number>`COALESCE(SUM(CASE WHEN ${timeTracking.isBillable} THEN ${timeTracking.duration} ELSE 0 END) / 60.0, 0)`,
      avgHourlyRate: sql<number>`AVG(CAST(${timeTracking.hourlyRate} AS DECIMAL))`
    })
    .from(timeTracking)
    .where(eq(timeTracking.userId, freelancerId))

  return {
    currentMonthEarnings: currentMonthAmount,
    previousMonthEarnings: previousMonthAmount,
    growthRate: Math.round(growthRate * 100) / 100,
    averageProjectValue: Number(avgProject?.avgValue) || 0,
    totalProjects: Number(avgProject?.totalProjects) || 0,
    totalHoursTracked: Number(timeStats?.totalHours) || 0,
    billableHours: Number(timeStats?.billableHours) || 0,
    averageHourlyRate: Number(timeStats?.avgHourlyRate) || 0
  }
}

// Get upcoming payments
export async function getUpcomingPayments(freelancerId: number) {
  const upcomingMilestones = await db
    .select({
      milestoneId: jobMilestones.id,
      milestoneTitle: jobMilestones.title,
      jobTitle: jobPostings.title,
      amount: jobMilestones.amount,
      dueDate: jobMilestones.dueDate,
      status: jobMilestones.status,
      clientName: users.name,
      autoReleaseEnabled: jobMilestones.autoReleaseEnabled
    })
    .from(jobMilestones)
    .innerJoin(jobPostings, eq(jobMilestones.jobId, jobPostings.id))
    .innerJoin(users, eq(jobPostings.clientId, users.id))
    .where(
      and(
        eq(jobPostings.freelancerId, freelancerId),
        sql`${jobMilestones.status} IN ('in_progress', 'submitted', 'pending')`
      )
    )
    .orderBy(asc(jobMilestones.dueDate))

  return upcomingMilestones.map(m => ({
    milestoneId: m.milestoneId,
    milestoneTitle: m.milestoneTitle,
    jobTitle: m.jobTitle,
    amount: m.amount,
    dueDate: m.dueDate,
    status: m.status,
    clientName: m.clientName || 'Unknown Client',
    autoReleaseEnabled: m.autoReleaseEnabled
  }))
}

// Get payment history with filters
export async function getPaymentHistory(
  freelancerId: number,
  filters?: {
    startDate?: Date
    endDate?: Date
    status?: string
    clientId?: number
    minAmount?: number
    maxAmount?: number
  }
) {
  const conditions = [eq(earnings.freelancerId, freelancerId)]

  if (filters?.startDate && filters?.endDate) {
    conditions.push(
      between(earnings.createdAt, filters.startDate, filters.endDate)
    )
  }

  if (filters?.status) {
    conditions.push(eq(earnings.status, filters.status))
  }

  if (filters?.minAmount) {
    conditions.push(
      sql`CAST(${earnings.netAmount} AS DECIMAL) >= ${filters.minAmount}`
    )
  }

  if (filters?.maxAmount) {
    conditions.push(
      sql`CAST(${earnings.netAmount} AS DECIMAL) <= ${filters.maxAmount}`
    )
  }

  const payments = await db
    .select({
      id: earnings.id,
      amount: earnings.amount,
      netAmount: earnings.netAmount,
      platformFee: earnings.platformFee,
      type: earnings.type,
      status: earnings.status,
      description: earnings.description,
      createdAt: earnings.createdAt,
      availableAt: earnings.availableAt,
      jobTitle: jobPostings.title,
      milestoneTitle: jobMilestones.title,
      clientName: users.name,
      clientId: users.id
    })
    .from(earnings)
    .leftJoin(jobPostings, eq(earnings.jobId, jobPostings.id))
    .leftJoin(jobMilestones, eq(earnings.milestoneId, jobMilestones.id))
    .leftJoin(users, eq(jobPostings.clientId, users.id))
    .where(and(...conditions))
    .orderBy(desc(earnings.createdAt))

  if (filters?.clientId) {
    return payments.filter(p => p.clientId === filters.clientId)
  }

  return payments
}
