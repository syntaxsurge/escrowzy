import { NextResponse } from 'next/server'

import { and, eq, lt } from 'drizzle-orm'

import { envServer } from '@/config/env.server'
import { db } from '@/lib/db/drizzle'
import { trades, teamMembers, teams, ActivityType } from '@/lib/db/schema'
import { createTradeNotification } from '@/services/notification'
import { TRADE_STATUS } from '@/types/listings'

export async function GET(request: Request) {
  try {
    // Check for cron secret to ensure this is called by the cron service
    const authHeader = request.headers.get('authorization')
    const cronSecret = envServer.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    // Find all trades that have expired deposit deadlines
    const expiredTrades = await db
      .select()
      .from(trades)
      .where(
        and(
          eq(trades.status, TRADE_STATUS.AWAITING_DEPOSIT),
          lt(trades.depositDeadline, now)
        )
      )

    if (expiredTrades.length === 0) {
      return NextResponse.json({
        message: 'No expired trades found',
        count: 0
      })
    }

    // Update all expired trades to cancelled status
    const tradeIds = expiredTrades.map(trade => trade.id)

    // Update all expired trades to cancelled status
    for (const trade of expiredTrades) {
      const currentMetadata = trade.metadata || {}
      const updatedMetadata = {
        ...currentMetadata,
        cancellationReason: 'Payment window expired'
      }

      await db
        .update(trades)
        .set({
          status: TRADE_STATUS.CANCELLED,
          metadata: updatedMetadata
        })
        .where(eq(trades.id, trade.id))
    }

    // Log the cancellations
    console.log(`Cancelled ${expiredTrades.length} expired trades:`, tradeIds)

    // Send notifications to affected users
    for (const trade of expiredTrades) {
      // Get team ID for both users - use a default team if needed
      const buyerTeam = await db
        .select()
        .from(teamMembers)
        .leftJoin(teams, eq(teamMembers.teamId, teams.id))
        .where(eq(teamMembers.userId, trade.buyerId))
        .limit(1)

      const sellerTeam = await db
        .select()
        .from(teamMembers)
        .leftJoin(teams, eq(teamMembers.teamId, teams.id))
        .where(eq(teamMembers.userId, trade.sellerId))
        .limit(1)

      const buyerTeamId = buyerTeam[0]?.team_members?.teamId || 1
      const sellerTeamId = sellerTeam[0]?.team_members?.teamId || 1

      // Create notifications for both parties
      await createTradeNotification(
        trade.id,
        trade.buyerId,
        trade.sellerId,
        buyerTeamId,
        ActivityType.TRADE_EXPIRED,
        'Your trade has expired due to timeout',
        'Your trade has expired due to timeout'
      )
    }

    return NextResponse.json({
      message: `Cancelled ${expiredTrades.length} expired trades`,
      count: expiredTrades.length,
      tradeIds
    })
  } catch (error) {
    console.error('Error updating expired trades:', error)
    return NextResponse.json(
      {
        error: 'Failed to update expired trades'
      },
      { status: 500 }
    )
  }
}

// Also support POST for flexibility in cron services
export async function POST(request: Request) {
  return GET(request)
}
