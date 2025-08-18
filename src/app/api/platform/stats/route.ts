import { NextResponse } from 'next/server'

import { sql, count, sum, eq } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import {
  escrowListings,
  jobMilestones,
  users,
  battles,
  achievementNFTs
} from '@/lib/db/schema'

export async function GET() {
  try {
    // Get total users on platform
    const [totalUsersResult] = await db.select({ count: count() }).from(users)

    // Get active listings (all types: P2P, domain, service)
    const [activeListingsResult] = await db
      .select({
        count: count(),
        p2p: count(
          sql`CASE WHEN ${escrowListings.listingCategory} = 'p2p' THEN 1 END`
        ),
        domain: count(
          sql`CASE WHEN ${escrowListings.listingCategory} = 'domain' THEN 1 END`
        ),
        service: count(
          sql`CASE WHEN ${escrowListings.listingCategory} = 'service' THEN 1 END`
        )
      })
      .from(escrowListings)
      .where(eq(escrowListings.isActive, true))

    // Get total escrow volume (completed milestones)
    const [escrowVolumeResult] = await db
      .select({
        totalVolume: sum(jobMilestones.amount),
        completedCount: count()
      })
      .from(jobMilestones)
      .where(eq(jobMilestones.status, 'completed'))

    // Get active escrows (in progress milestones)
    const [activeEscrowsResult] = await db
      .select({ count: count() })
      .from(jobMilestones)
      .where(eq(jobMilestones.status, 'in_progress'))

    // Get platform battle stats
    const [battleStatsResult] = await db
      .select({
        totalBattles: count(),
        todayBattles: count(
          sql`CASE WHEN DATE(${battles.createdAt}) = CURRENT_DATE THEN 1 END`
        )
      })
      .from(battles)

    // Get achievement unlocks (gamification engagement)
    const [achievementsResult] = await db
      .select({ totalUnlocked: count() })
      .from(achievementNFTs)

    // Get dispute resolution stats (using milestones disputes)
    const [disputeStats] = await db
      .select({
        total: count(),
        resolved: count(
          sql`CASE WHEN ${jobMilestones.status} = 'disputed_resolved' THEN 1 END`
        )
      })
      .from(jobMilestones)
      .where(sql`${jobMilestones.status} IN ('disputed', 'disputed_resolved')`)

    // Calculate success rate (non-disputed vs total completed)
    const successRate =
      disputeStats.total > 0
        ? ((disputeStats.resolved / disputeStats.total) * 100).toFixed(1)
        : '100'

    // Format the stats for display
    const stats = {
      // Main platform metrics
      totalUsers: totalUsersResult?.count || 0,
      activeListings: activeListingsResult?.count || 0,
      listingBreakdown: {
        p2p: activeListingsResult?.p2p || 0,
        domain: activeListingsResult?.domain || 0,
        service: activeListingsResult?.service || 0
      },

      // Escrow metrics
      activeEscrows: activeEscrowsResult?.count || 0,
      totalVolume: escrowVolumeResult?.totalVolume
        ? parseFloat(escrowVolumeResult.totalVolume)
        : 0,
      completedEscrows: escrowVolumeResult?.completedCount || 0,

      // Gamification metrics
      totalBattles: battleStatsResult?.totalBattles || 0,
      dailyBattles: battleStatsResult?.todayBattles || 0,
      achievementsUnlocked: achievementsResult?.totalUnlocked || 0,

      // Trust metrics
      successRate: parseFloat(successRate),
      disputesResolved: disputeStats.resolved || 0
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Failed to fetch platform stats:', error)

    // Return zeros instead of error to not break the landing page
    return NextResponse.json({
      totalUsers: 0,
      activeListings: 0,
      listingBreakdown: { p2p: 0, domain: 0, service: 0 },
      activeEscrows: 0,
      totalVolume: 0,
      completedEscrows: 0,
      totalBattles: 0,
      dailyBattles: 0,
      achievementsUnlocked: 0,
      successRate: 100,
      disputesResolved: 0
    })
  }
}
