import { and, desc, eq, gte, lte, or, sql } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { battles, userGameData, userSubscriptions } from '@/lib/db/schema'
import { rewardsService } from '@/services/rewards'
import type {
  Battle,
  BattleDiscount,
  BattleHistory,
  BattleMatchmakingParams,
  BattleResult,
  BattleStats,
  DailyBattleLimit,
  NewBattle
} from '@/types/battle'

const BATTLE_CONSTANTS = {
  DEFAULT_MATCH_RANGE: 20, // 20% CP range
  FREE_TIER_DAILY_LIMIT: 3,
  PRO_TIER_DAILY_LIMIT: 10,
  ENTERPRISE_TIER_DAILY_LIMIT: Infinity,
  WINNER_DISCOUNT_PERCENT: 25,
  DISCOUNT_DURATION_HOURS: 24,
  SAME_OPPONENT_COOLDOWN_HOURS: 24,
  CP_RANDOM_FACTOR: 50
}

/**
 * Get user's current active battle discount
 */
export async function getActiveDiscount(
  userId: number
): Promise<BattleDiscount | null> {
  try {
    const now = new Date()

    const [activeDiscount] = await db
      .select({
        userId: battles.winnerId,
        discountPercent: battles.feeDiscountPercent,
        expiresAt: battles.discountExpiresAt,
        battleId: battles.id
      })
      .from(battles)
      .where(
        and(eq(battles.winnerId, userId), gte(battles.discountExpiresAt, now))
      )
      .orderBy(desc(battles.createdAt))
      .limit(1)

    if (
      !activeDiscount ||
      !activeDiscount.discountPercent ||
      !activeDiscount.expiresAt
    ) {
      return null
    }

    return {
      userId: activeDiscount.userId!,
      discountPercent: activeDiscount.discountPercent,
      expiresAt: activeDiscount.expiresAt,
      battleId: activeDiscount.battleId
    }
  } catch (error) {
    console.error('Error getting active discount:', error)
    throw error
  }
}

/**
 * Get user's daily battle limit based on subscription
 */
export async function getDailyBattleLimit(
  userId: number
): Promise<DailyBattleLimit> {
  try {
    // Get user's subscription
    const [subscription] = await db
      .select()
      .from(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.isActive, true)
        )
      )
      .limit(1)

    // Determine max battles based on plan
    let maxBattles = BATTLE_CONSTANTS.FREE_TIER_DAILY_LIMIT
    if (subscription) {
      if (subscription.planId === 'pro') {
        maxBattles = BATTLE_CONSTANTS.PRO_TIER_DAILY_LIMIT
      } else if (subscription.planId === 'enterprise') {
        maxBattles = BATTLE_CONSTANTS.ENTERPRISE_TIER_DAILY_LIMIT
      }
    }

    // Count today's battles
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todaysBattles = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(battles)
      .where(
        and(
          or(eq(battles.player1Id, userId), eq(battles.player2Id, userId)),
          gte(battles.createdAt, today)
        )
      )

    const battlesUsed = todaysBattles[0]?.count || 0

    // Calculate reset time (next midnight)
    const resetsAt = new Date(today)
    resetsAt.setDate(resetsAt.getDate() + 1)

    return {
      userId,
      battlesUsed,
      maxBattles,
      resetsAt
    }
  } catch (error) {
    console.error('Error getting daily battle limit:', error)
    throw error
  }
}

/**
 * Find a suitable opponent for matchmaking
 */
export async function findMatch(
  params: BattleMatchmakingParams
): Promise<{ userId: number; combatPower: number } | null> {
  try {
    const {
      userId,
      combatPower,
      matchRange = BATTLE_CONSTANTS.DEFAULT_MATCH_RANGE
    } = params

    // Calculate CP range for matching
    const minCP = Math.floor(combatPower * (1 - matchRange / 100))
    const maxCP = Math.ceil(combatPower * (1 + matchRange / 100))

    // Get recent opponent IDs to avoid (last 24 hours)
    const cooldownTime = new Date()
    cooldownTime.setHours(
      cooldownTime.getHours() - BATTLE_CONSTANTS.SAME_OPPONENT_COOLDOWN_HOURS
    )

    const recentOpponents = await db
      .select({
        opponentId: sql<number>`
          CASE 
            WHEN ${battles.player1Id} = ${userId} THEN ${battles.player2Id}
            ELSE ${battles.player1Id}
          END
        `
      })
      .from(battles)
      .where(
        and(
          or(eq(battles.player1Id, userId), eq(battles.player2Id, userId)),
          gte(battles.createdAt, cooldownTime)
        )
      )

    const excludeIds = [
      userId,
      ...recentOpponents.map((r: { opponentId: number }) => r.opponentId)
    ]

    // Find potential opponents
    const potentialOpponents = await db
      .select({
        userId: userGameData.userId,
        combatPower: userGameData.combatPower
      })
      .from(userGameData)
      .where(
        and(
          sql`${userGameData.userId} NOT IN (${sql.join(
            excludeIds.map(id => sql`${id}`),
            sql`, `
          )})`,
          gte(userGameData.combatPower, minCP),
          lte(userGameData.combatPower, maxCP)
        )
      )
      .orderBy(sql`RANDOM()`)
      .limit(1)

    return potentialOpponents[0] || null
  } catch (error) {
    console.error('Error finding match:', error)
    throw error
  }
}

/**
 * Create a new battle between two players
 */
export async function createBattle(
  player1Id: number,
  player2Id: number
): Promise<BattleResult> {
  try {
    // Get both players' combat power
    const [player1Data, player2Data] = await Promise.all([
      db
        .select({ combatPower: userGameData.combatPower })
        .from(userGameData)
        .where(eq(userGameData.userId, player1Id))
        .limit(1),
      db
        .select({ combatPower: userGameData.combatPower })
        .from(userGameData)
        .where(eq(userGameData.userId, player2Id))
        .limit(1)
    ])

    if (!player1Data[0] || !player2Data[0]) {
      throw new Error('Player game data not found')
    }

    const player1CP = player1Data[0].combatPower
    const player2CP = player2Data[0].combatPower

    // Calculate battle outcome
    const player1Score =
      player1CP + Math.random() * BATTLE_CONSTANTS.CP_RANDOM_FACTOR
    const player2Score =
      player2CP + Math.random() * BATTLE_CONSTANTS.CP_RANDOM_FACTOR

    const winnerId = player1Score > player2Score ? player1Id : player2Id
    const loserId = winnerId === player1Id ? player2Id : player1Id
    const winnerCP = winnerId === player1Id ? player1CP : player2CP
    const loserCP = winnerId === player1Id ? player2CP : player1CP

    // Calculate discount expiration
    const discountExpiresAt = new Date()
    discountExpiresAt.setHours(
      discountExpiresAt.getHours() + BATTLE_CONSTANTS.DISCOUNT_DURATION_HOURS
    )

    // Create battle record
    const newBattle: NewBattle = {
      player1Id,
      player2Id,
      winnerId,
      player1CP,
      player2CP,
      feeDiscountPercent: BATTLE_CONSTANTS.WINNER_DISCOUNT_PERCENT,
      discountExpiresAt
    }

    await db.insert(battles).values(newBattle).returning()

    // Update winner's combat power and stats using rewards service
    const loserGameData = await rewardsService.getOrCreateGameData(loserId)
    await rewardsService.handleBattleWin(winnerId, loserGameData.combatPower)

    // Update loser's stats using rewards service
    await rewardsService.handleBattleLoss(loserId)

    return {
      winnerId,
      loserId,
      winnerCP,
      loserCP,
      feeDiscountPercent: BATTLE_CONSTANTS.WINNER_DISCOUNT_PERCENT,
      discountExpiresAt
    }
  } catch (error) {
    console.error('Error creating battle:', error)
    throw error
  }
}

/**
 * Get user's battle history with stats
 */
export async function getBattleHistory(
  userId: number,
  limit = 20,
  offset = 0
): Promise<BattleHistory> {
  try {
    // Get battles
    const userBattles = await db
      .select()
      .from(battles)
      .where(or(eq(battles.player1Id, userId), eq(battles.player2Id, userId)))
      .orderBy(desc(battles.createdAt))
      .limit(limit)
      .offset(offset)

    // Calculate stats
    const wins = userBattles.filter((b: Battle) => b.winnerId === userId).length
    const losses = userBattles.filter(
      (b: Battle) =>
        b.winnerId !== userId &&
        (b.player1Id === userId || b.player2Id === userId)
    ).length
    const totalBattles = wins + losses
    const winRate = totalBattles > 0 ? (wins / totalBattles) * 100 : 0

    // Calculate streaks
    let currentStreak = 0
    let bestStreak = 0
    let tempStreak = 0

    for (const battle of userBattles) {
      if (battle.winnerId === userId) {
        tempStreak++
        currentStreak = tempStreak
        bestStreak = Math.max(bestStreak, tempStreak)
      } else {
        tempStreak = 0
      }
    }

    return {
      battles: userBattles,
      totalBattles,
      wins,
      losses,
      winRate,
      currentStreak,
      bestStreak
    }
  } catch (error) {
    console.error('Error getting battle history:', error)
    throw error
  }
}

/**
 * Get battle statistics for a user
 */
export async function getBattleStats(userId: number): Promise<BattleStats> {
  try {
    const userBattles = await db
      .select()
      .from(battles)
      .where(or(eq(battles.player1Id, userId), eq(battles.player2Id, userId)))

    const wins = userBattles.filter((b: Battle) => b.winnerId === userId).length
    const losses = userBattles.filter(
      (b: Battle) =>
        b.winnerId !== userId &&
        (b.player1Id === userId || b.player2Id === userId)
    ).length
    const totalBattles = wins + losses
    const winRate = totalBattles > 0 ? (wins / totalBattles) * 100 : 0

    // Calculate average CP from recent battles
    const recentBattles = userBattles.slice(0, 10)
    const cpValues = recentBattles.map((b: Battle) =>
      b.player1Id === userId ? b.player1CP : b.player2CP
    )
    const averageCP =
      cpValues.length > 0
        ? cpValues.reduce((sum: number, cp: number) => sum + cp, 0) /
          cpValues.length
        : 100

    // Count total discounts earned
    const totalDiscountsEarned = wins

    // Get active discount
    const activeDiscount = await getActiveDiscount(userId)

    return {
      totalBattles,
      wins,
      losses,
      winRate,
      averageCP,
      totalDiscountsEarned,
      activeDiscount: activeDiscount || undefined
    }
  } catch (error) {
    console.error('Error getting battle stats:', error)
    throw error
  }
}

/**
 * Check if user can battle today
 */
export async function canBattleToday(userId: number): Promise<boolean> {
  try {
    const limit = await getDailyBattleLimit(userId)
    return limit.battlesUsed < limit.maxBattles
  } catch (error) {
    console.error('Error checking battle eligibility:', error)
    return false
  }
}
