import { NextRequest, NextResponse } from 'next/server'

import { and, desc, eq, gte, lte, sql } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { earnings, jobMilestones, jobPostings } from '@/lib/db/schema'
import { getUser } from '@/services/user'

// GET /api/earnings - Get freelancer earnings
export async function GET(request: NextRequest) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query conditions
    const conditions = [eq(earnings.freelancerId, user.id)]

    if (status) {
      conditions.push(eq(earnings.status, status))
    }

    if (type) {
      conditions.push(eq(earnings.type, type))
    }

    if (startDate) {
      conditions.push(gte(earnings.createdAt, new Date(startDate)))
    }

    if (endDate) {
      conditions.push(lte(earnings.createdAt, new Date(endDate)))
    }

    // Fetch earnings with job and milestone details
    const userEarnings = await db
      .select({
        earning: earnings,
        job: {
          id: jobPostings.id,
          title: jobPostings.title
        },
        milestone: {
          id: jobMilestones.id,
          title: jobMilestones.title
        }
      })
      .from(earnings)
      .leftJoin(jobPostings, eq(earnings.jobId, jobPostings.id))
      .leftJoin(jobMilestones, eq(earnings.milestoneId, jobMilestones.id))
      .where(conditions.length > 1 ? and(...conditions) : conditions[0])
      .orderBy(desc(earnings.createdAt))
      .limit(limit)
      .offset(offset)

    // Calculate totals
    const [totals] = await db
      .select({
        totalEarned: sql<string>`COALESCE(SUM(CASE WHEN status = 'completed' THEN CAST(amount AS DECIMAL) ELSE 0 END), 0)`,
        totalPending: sql<string>`COALESCE(SUM(CASE WHEN status = 'pending' THEN CAST(amount AS DECIMAL) ELSE 0 END), 0)`,
        totalWithdrawn: sql<string>`COALESCE(SUM(CASE WHEN status = 'withdrawn' THEN CAST(amount AS DECIMAL) ELSE 0 END), 0)`,
        totalTips: sql<string>`COALESCE(SUM(CAST(tip AS DECIMAL)), 0)`
      })
      .from(earnings)
      .where(eq(earnings.freelancerId, user.id))

    return NextResponse.json({
      earnings: userEarnings,
      totals: {
        totalEarned: totals?.totalEarned || '0',
        totalPending: totals?.totalPending || '0',
        totalWithdrawn: totals?.totalWithdrawn || '0',
        totalTips: totals?.totalTips || '0',
        availableBalance: (
          parseFloat(totals?.totalEarned || '0') -
          parseFloat(totals?.totalWithdrawn || '0')
        ).toString()
      },
      hasMore: userEarnings.length === limit
    })
  } catch (error) {
    console.error('Error fetching earnings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch earnings' },
      { status: 500 }
    )
  }
}

// GET /api/earnings/stats - Get earnings statistics
export async function POST(request: NextRequest) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { period = '30d' } = body

    // Calculate date range based on period
    let startDate = new Date()
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(startDate.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
      case 'all':
        startDate = new Date(0)
        break
    }

    // Get earnings by date
    const earningsByDate = await db
      .select({
        date: sql<string>`DATE(created_at)`,
        amount: sql<string>`SUM(CAST(amount AS DECIMAL))`,
        count: sql<number>`COUNT(*)`
      })
      .from(earnings)
      .where(
        and(
          eq(earnings.freelancerId, user.id),
          eq(earnings.status, 'completed'),
          gte(earnings.createdAt, startDate)
        )
      )
      .groupBy(sql`DATE(created_at)`)
      .orderBy(sql`DATE(created_at)`)

    // Get earnings by job
    const earningsByJob = await db
      .select({
        jobId: earnings.jobId,
        jobTitle: jobPostings.title,
        totalAmount: sql<string>`SUM(CAST(${earnings.amount} AS DECIMAL))`,
        milestoneCount: sql<number>`COUNT(DISTINCT ${earnings.milestoneId})`
      })
      .from(earnings)
      .leftJoin(jobPostings, eq(earnings.jobId, jobPostings.id))
      .where(
        and(
          eq(earnings.freelancerId, user.id),
          eq(earnings.status, 'completed'),
          gte(earnings.createdAt, startDate)
        )
      )
      .groupBy(earnings.jobId, jobPostings.title)
      .orderBy(sql`SUM(CAST(${earnings.amount} AS DECIMAL)) DESC`)
      .limit(10)

    // Get top earning months
    const topMonths = await db
      .select({
        month: sql<string>`TO_CHAR(created_at, 'YYYY-MM')`,
        amount: sql<string>`SUM(CAST(amount AS DECIMAL))`,
        count: sql<number>`COUNT(*)`
      })
      .from(earnings)
      .where(
        and(
          eq(earnings.freelancerId, user.id),
          eq(earnings.status, 'completed')
        )
      )
      .groupBy(sql`TO_CHAR(created_at, 'YYYY-MM')`)
      .orderBy(sql`SUM(CAST(amount AS DECIMAL)) DESC`)
      .limit(12)

    return NextResponse.json({
      stats: {
        earningsByDate,
        earningsByJob,
        topMonths,
        period
      }
    })
  } catch (error) {
    console.error('Error fetching earnings stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch earnings statistics' },
      { status: 500 }
    )
  }
}
