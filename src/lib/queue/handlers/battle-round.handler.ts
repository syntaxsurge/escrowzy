import { eq } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { battles, battleStates, battleRounds } from '@/lib/db/schema'
import { broadcastBattleStats } from '@/lib/pusher-server'
import { dispatch } from '@/lib/queue/manager'
import type { BattleRoundPayload } from '@/lib/queue/types'
import { rewardsService } from '@/services/rewards'

const BATTLE_CONSTANTS = {
  ROUNDS_PER_BATTLE: 30,
  BASE_DAMAGE: 15,
  DAMAGE_VARIANCE: 10,
  CRITICAL_HIT_CHANCE: 0.2,
  CRITICAL_MULTIPLIER: 2,
  ROUND_DELAY: 6000, // 6 seconds between rounds
  DISCOUNT_DURATION_HOURS: 24,
  WINNER_DISCOUNT_PERCENT: 25
}

export async function handleBattleRound(
  payload: BattleRoundPayload
): Promise<void> {
  const { battleId, roundNumber } = payload

  // Get battle and state
  const [battle] = await db
    .select()
    .from(battles)
    .where(eq(battles.id, battleId))
    .limit(1)

  if (!battle || battle.status === 'completed') {
    console.log(`Battle ${battleId} is already completed or doesn't exist`)
    return
  }

  const [battleState] = await db
    .select()
    .from(battleStates)
    .where(eq(battleStates.battleId, battleId))
    .limit(1)

  if (!battleState) {
    throw new Error(`Battle state not found for battle ${battleId}`)
  }

  // Update battle status to ongoing if this is the first round
  if (roundNumber === 1 && battle.status === 'preparing') {
    await db
      .update(battles)
      .set({
        status: 'ongoing',
        startedAt: new Date()
      })
      .where(eq(battles.id, battleId))
  }

  // Process the round
  const attacker = Math.random() > 0.5 ? 1 : 2
  const attackPower = attacker === 1 ? battle.player1CP : battle.player2CP
  const defensePower = attacker === 1 ? battle.player2CP : battle.player1CP

  // Calculate damage
  const baseDamage =
    BATTLE_CONSTANTS.BASE_DAMAGE +
    Math.random() * BATTLE_CONSTANTS.DAMAGE_VARIANCE
  const powerRatio = attackPower / (attackPower + defensePower)
  const damageMultiplier = 0.5 + powerRatio + Math.random() * 0.5

  // Critical hit calculation
  const isCritical = Math.random() < BATTLE_CONSTANTS.CRITICAL_HIT_CHANCE
  const critMultiplier = isCritical ? BATTLE_CONSTANTS.CRITICAL_MULTIPLIER : 1

  const damage = Math.floor(baseDamage * damageMultiplier * critMultiplier)

  // Apply damage
  let player1Health = battleState.player1Health
  let player2Health = battleState.player2Health

  if (attacker === 1) {
    player2Health = Math.max(0, player2Health - damage)
  } else {
    player1Health = Math.max(0, player1Health - damage)
  }

  // Save round data
  await db.insert(battleRounds).values({
    battleId,
    roundNumber,
    attacker,
    damage,
    isCritical,
    player1Health,
    player2Health
  })

  // Update battle state
  const battleLog = battleState.battleLog as any[]
  battleLog.push({
    round: roundNumber,
    attacker,
    damage,
    isCritical,
    player1Health,
    player2Health,
    timestamp: new Date().toISOString()
  })

  await db
    .update(battleStates)
    .set({
      currentRound: roundNumber,
      player1Health,
      player2Health,
      battleLog,
      lastActionAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(battleStates.battleId, battleId))

  // Check if battle should end
  if (
    player1Health <= 0 ||
    player2Health <= 0 ||
    roundNumber >= BATTLE_CONSTANTS.ROUNDS_PER_BATTLE
  ) {
    // Battle is complete
    await completeBattle(
      battleId,
      player1Health,
      player2Health,
      battle.player1Id,
      battle.player2Id
    )
  } else {
    // Schedule next round
    await dispatch(
      'battle.round',
      {
        battleId,
        roundNumber: roundNumber + 1
      },
      {
        delay: BATTLE_CONSTANTS.ROUND_DELAY
      }
    )
  }
}

async function completeBattle(
  battleId: number,
  player1Health: number,
  player2Health: number,
  player1Id: number,
  player2Id: number
): Promise<void> {
  // Determine winner based on remaining health
  const winnerId = player1Health > player2Health ? player1Id : player2Id
  const loserId = winnerId === player1Id ? player2Id : player1Id

  // Calculate discount expiration
  const discountExpiresAt = new Date()
  discountExpiresAt.setHours(
    discountExpiresAt.getHours() + BATTLE_CONSTANTS.DISCOUNT_DURATION_HOURS
  )

  // Update battle with winner
  await db
    .update(battles)
    .set({
      winnerId,
      status: 'completed',
      completedAt: new Date(),
      discountExpiresAt
    })
    .where(eq(battles.id, battleId))

  // Get player game data for rewards
  const loserGameData = await rewardsService.getOrCreateGameData(loserId)

  // Update winner's stats
  await rewardsService.handleBattleWin(winnerId, loserGameData.combatPower)

  // Update loser's stats
  await rewardsService.handleBattleLoss(loserId)

  // Broadcast stats update
  await broadcastBattleStats()

  console.log(`✅ Battle ${battleId} completed. Winner: ${winnerId}`)
}
