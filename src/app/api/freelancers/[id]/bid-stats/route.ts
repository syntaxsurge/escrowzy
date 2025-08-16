import { NextRequest, NextResponse } from 'next/server'

import { and, eq, sql } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { jobBids } from '@/lib/db/schema'
import { getUser } from '@/services/user'

// GET /api/freelancers/[id]/bid-stats - Get bid statistics for a freelancer
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const freelancerId = parseInt(params.id)
    if (isNaN(freelancerId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid freelancer ID' },
        { status: 400 }
      )
    }

    // Check if user is authorized to view these stats
    const user = await getUser()
    if (!user || user.id !== freelancerId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get bid statistics
    const [stats] = await db
      .select({
        totalBids: sql<number>`count(*)`,
        activeBids: sql<number>`count(*) FILTER (WHERE ${jobBids.status} IN ('pending', 'shortlisted'))`,
        wonBids: sql<number>`count(*) FILTER (WHERE ${jobBids.status} = 'accepted')`,
        rejectedBids: sql<number>`count(*) FILTER (WHERE ${jobBids.status} = 'rejected')`,
        avgBidAmount: sql<number>`avg(CAST(${jobBids.bidAmount} AS DECIMAL))`,
        totalProposedAmount: sql<number>`sum(CAST(${jobBids.bidAmount} AS DECIMAL))`,
        avgDeliveryDays: sql<number>`avg(${jobBids.deliveryDays})`
      })
      .from(jobBids)
      .where(eq(jobBids.freelancerId, freelancerId))

    // Calculate success rate
    const totalCompleted =
      Number(stats.wonBids) + Number(stats.rejectedBids) || 1
    const successRate =
      totalCompleted > 0
        ? Math.round((Number(stats.wonBids) / totalCompleted) * 100)
        : 0

    // Get total earnings from accepted bids (this would need to be tracked separately in production)
    const [earnings] = await db
      .select({
        totalEarnings: sql<number>`sum(CAST(${jobBids.bidAmount} AS DECIMAL))`
      })
      .from(jobBids)
      .where(
        and(
          eq(jobBids.freelancerId, freelancerId),
          eq(jobBids.status, 'accepted')
        )
      )

    return NextResponse.json({
      success: true,
      stats: {
        totalBids: Number(stats.totalBids) || 0,
        activeBids: Number(stats.activeBids) || 0,
        wonBids: Number(stats.wonBids) || 0,
        totalEarnings: Number(earnings.totalEarnings) || 0,
        successRate,
        avgBidAmount: Number(stats.avgBidAmount) || 0,
        avgDeliveryDays: Number(stats.avgDeliveryDays) || 0
      }
    })
  } catch (error) {
    console.error('Error fetching bid statistics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
