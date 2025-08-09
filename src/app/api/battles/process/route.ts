import { NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'

import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db/drizzle'
import { battles, battleStates, battleRounds } from '@/lib/db/schema'
import { sendBattleEvent } from '@/lib/pusher-server'
import { rewardsService } from '@/services/rewards'

const BATTLE_CONSTANTS = {
  ROUNDS_PER_BATTLE: 30,
  BASE_DAMAGE: 5,
  DAMAGE_VARIANCE: 8,
  CRITICAL_HIT_CHANCE: 0.15,
  CRITICAL_MULTIPLIER: 2,
  ROUND_INTERVAL: 3000, // 3 seconds between rounds
  DISCOUNT_DURATION_HOURS: 24,
  WINNER_DISCOUNT_PERCENT: 25
}

interface BattleAction {
  type: 'attack' | 'defend' | 'special'
  power?: number
  timestamp: number
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { battleId, action } = await request.json()

    // Get battle and validate participant
    const [battle] = await db
      .select()
      .from(battles)
      .where(eq(battles.id, battleId))
      .limit(1)

    if (!battle) {
      return NextResponse.json(
        { success: false, error: 'Battle not found' },
        { status: 404 }
      )
    }

    const isPlayer1 = battle.player1Id === session.user.id
    const isPlayer2 = battle.player2Id === session.user.id

    if (!isPlayer1 && !isPlayer2) {
      return NextResponse.json(
        { success: false, error: 'Not a participant in this battle' },
        { status: 403 }
      )
    }

    // Get or create battle state
    let [battleState] = await db
      .select()
      .from(battleStates)
      .where(eq(battleStates.battleId, battleId))
      .limit(1)

    if (!battleState) {
      // Initialize battle state
      await db.insert(battleStates).values({
        battleId,
        currentRound: 0,
        player1Health: 100,
        player2Health: 100,
        player1Actions: [],
        player2Actions: [],
        battleLog: []
      })

      battleState = (
        await db
          .select()
          .from(battleStates)
          .where(eq(battleStates.battleId, battleId))
          .limit(1)
      )[0]
    }

    // Handle action from player
    if (action) {
      const playerActions = isPlayer1
        ? (battleState.player1Actions as BattleAction[]) || []
        : (battleState.player2Actions as BattleAction[]) || []

      playerActions.push({
        type: action.type || 'attack',
        power: action.power || 1,
        timestamp: Date.now()
      })

      await db
        .update(battleStates)
        .set({
          [isPlayer1 ? 'player1Actions' : 'player2Actions']: playerActions,
          lastActionAt: new Date()
        })
        .where(eq(battleStates.battleId, battleId))
    }

    // Process battle round if it's time
    if (battle.status === 'preparing') {
      // Start the battle
      await db
        .update(battles)
        .set({
          status: 'ongoing',
          startedAt: new Date()
        })
        .where(eq(battles.id, battleId))

      // Send battle started event
      await sendBattleEvent('battle-started', {
        battleId,
        player1Id: battle.player1Id,
        player2Id: battle.player2Id
      })
    }

    // Process round if ongoing
    if (battle.status === 'ongoing' && battleState) {
      const shouldProcessRound =
        !battleState.lastActionAt ||
        Date.now() - new Date(battleState.lastActionAt).getTime() >
          BATTLE_CONSTANTS.ROUND_INTERVAL

      if (shouldProcessRound) {
        const newRound = battleState.currentRound + 1

        // Calculate damage for this round
        const attacker = Math.random() > 0.5 ? 1 : 2
        const attackPower = attacker === 1 ? battle.player1CP : battle.player2CP
        const defensePower =
          attacker === 1 ? battle.player2CP : battle.player1CP

        // Factor in player actions
        const attackerActions =
          attacker === 1
            ? (battleState.player1Actions as BattleAction[]) || []
            : (battleState.player2Actions as BattleAction[]) || []

        const actionBonus = attackerActions.length * 2 // Bonus for being active

        // Calculate damage
        const baseDamage =
          BATTLE_CONSTANTS.BASE_DAMAGE +
          Math.random() * BATTLE_CONSTANTS.DAMAGE_VARIANCE
        const powerRatio =
          (attackPower + actionBonus) / (attackPower + defensePower)
        const damageMultiplier = 0.5 + powerRatio

        const isCritical = Math.random() < BATTLE_CONSTANTS.CRITICAL_HIT_CHANCE
        const critMultiplier = isCritical
          ? BATTLE_CONSTANTS.CRITICAL_MULTIPLIER
          : 1

        const damage = Math.floor(
          baseDamage * damageMultiplier * critMultiplier
        )

        // Apply damage
        let player1Health = battleState.player1Health
        let player2Health = battleState.player2Health

        if (attacker === 1) {
          player2Health = Math.max(0, player2Health - damage)
        } else {
          player1Health = Math.max(0, player1Health - damage)
        }

        // Update battle log
        const battleLog = (battleState.battleLog as any[]) || []
        battleLog.push({
          round: newRound,
          attacker,
          damage,
          isCritical,
          player1Health,
          player2Health,
          timestamp: new Date().toISOString()
        })

        // Save round
        await db.insert(battleRounds).values({
          battleId,
          roundNumber: newRound,
          attacker,
          damage,
          isCritical,
          player1Health,
          player2Health
        })

        // Update battle state
        await db
          .update(battleStates)
          .set({
            currentRound: newRound,
            player1Health,
            player2Health,
            battleLog,
            lastActionAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(battleStates.battleId, battleId))

        // Send real-time update
        await sendBattleEvent('battle-update', {
          battleId,
          round: newRound,
          attacker,
          damage,
          isCritical,
          player1Health,
          player2Health,
          player1Id: battle.player1Id,
          player2Id: battle.player2Id
        })

        // Check if battle should end
        if (
          player1Health <= 0 ||
          player2Health <= 0 ||
          newRound >= BATTLE_CONSTANTS.ROUNDS_PER_BATTLE
        ) {
          // Determine winner
          const winnerId =
            player1Health > player2Health ? battle.player1Id : battle.player2Id
          const loserId =
            winnerId === battle.player1Id ? battle.player2Id : battle.player1Id

          // Calculate discount expiration
          const discountExpiresAt = new Date()
          discountExpiresAt.setHours(
            discountExpiresAt.getHours() +
              BATTLE_CONSTANTS.DISCOUNT_DURATION_HOURS
          )

          // Update battle
          await db
            .update(battles)
            .set({
              winnerId,
              status: 'completed',
              completedAt: new Date(),
              discountExpiresAt
            })
            .where(eq(battles.id, battleId))

          // Update player stats
          const loserGameData =
            await rewardsService.getOrCreateGameData(loserId)
          await rewardsService.handleBattleWin(
            winnerId,
            loserGameData.combatPower
          )
          await rewardsService.handleBattleLoss(loserId)

          // Send completion event
          await sendBattleEvent('battle-completed', {
            battleId,
            winnerId,
            loserId,
            feeDiscountPercent: BATTLE_CONSTANTS.WINNER_DISCOUNT_PERCENT,
            player1Id: battle.player1Id,
            player2Id: battle.player2Id
          })
        }

        // Update state for response
        battleState.currentRound = newRound
        battleState.player1Health = player1Health
        battleState.player2Health = player2Health
        battleState.battleLog = battleLog
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        battleId,
        status: battle.status,
        currentRound: battleState?.currentRound || 0,
        player1Health: battleState?.player1Health || 100,
        player2Health: battleState?.player2Health || 100,
        battleLog: battleState?.battleLog || [],
        isPlayer1
      }
    })
  } catch (error) {
    console.error('Error processing battle:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
